import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { PDFDocument, StandardFonts } from "pdf-lib";

import { db } from "../../utils/db";
import logger from "../../utils/logger";
import { emails } from "../../schemas/schema";

export const print = async (req: Request, res: Response) => {
  try {
    const ability = req.ability;

    if (!ability?.can("read", "User")) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const canSeeEmails = ability.can("read", "Email");

    const usersList = await db.query.users.findMany({
      with: {
        emails: {
          where: eq(emails.isDeleted, false),
          columns: {
            email: canSeeEmails,
            isPrimary: true,
          },
        },
      },
    });

    const pdfDoc = await PDFDocument.create();
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const bodyFontSize = 12;
    const headerFontSize = 18;
    const margin = 50;
    const lineHeight = bodyFontSize + 4;

    let page = pdfDoc.addPage();
    let { height } = page.getSize();
    let cursorY = height - margin;

    const ensureSpace = (linesNeeded = 1) => {
      if (cursorY - linesNeeded * lineHeight <= margin) {
        page = pdfDoc.addPage();
        ({ height } = page.getSize());
        cursorY = height - margin;
      }
    };

    const writeLine = (
      text: string,
      options: { fontSize?: number; bold?: boolean } = {},
    ) => {
      ensureSpace();
      page.drawText(text, {
        x: margin,
        y: cursorY,
        size: options.fontSize ?? bodyFontSize,
        font: options.bold ? boldFont : regularFont,
      });
      cursorY -= lineHeight;
    };

    writeLine("Users Report", { fontSize: headerFontSize, bold: true });
    writeLine(`Generated at: ${new Date().toISOString()}`);
    ensureSpace(0.5);
    cursorY -= lineHeight / 2;

    if (usersList.length === 0) {
      writeLine("No users found.");
    } else {
      usersList.forEach((user, index) => {
        const emailEntries = canSeeEmails
          ? ((user.emails ?? []) as Array<{
              email?: string | null;
              isPrimary: boolean;
            }>)
              .map((item) => {
                if (!item.email) return undefined;
                return item.isPrimary
                  ? `${item.email} (primary)`
                  : item.email;
              })
              .filter((value): value is string => Boolean(value))
          : [];

        const emailLine = canSeeEmails
          ? emailEntries.length > 0
            ? `Emails: ${emailEntries.join(", ")}`
            : "Emails: N/A"
          : "Emails: Hidden";

        writeLine(`${index + 1}. ${user.name}`, { bold: true });
        writeLine(`Role: ${user.role}`);
        writeLine(`Age: ${user.age}`);
        writeLine(emailLine);
        ensureSpace(0.5);
        cursorY -= lineHeight / 2;
      });
    }

    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="users.pdf"');
    res.setHeader("Content-Length", pdfBytes.length);

    return res.send(Buffer.from(pdfBytes));
  } catch (error) {
    logger.error("User PDF export failed:", error);
    logger.debug("Debug info:", { error, userId: req.user?.id });
    return res.status(500).json({ error: "Internal server error" });
  }
};
