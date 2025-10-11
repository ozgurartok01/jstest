import express, { NextFunction, Request, Response } from "express";

import { authLogin, authRegister } from "./routes/auth";
import {
  userUpdate,
  userList,
  userDelete,
  userGet,
  userPrint,
} from "./routes/user";
import { requireAuth } from "./middleware/requireAuth";
import logger from "./utils/logger";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello Express + TypeScript!");
});

app.post("/auth/register", authRegister);
app.post("/auth/login", authLogin);

app.get("/users", requireAuth, userList);
app.get("/users/export/pdf", requireAuth, userPrint);
app.get("/users/:id", requireAuth, userGet);
app.patch("/users/:id",requireAuth,userUpdate,);
app.delete("/users/:id",requireAuth, userDelete);

app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error("Server error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () =>
  logger.info(`Server working on http://localhost:${PORT}`),
);
