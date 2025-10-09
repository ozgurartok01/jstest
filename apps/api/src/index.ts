import express, { NextFunction, Request, Response } from "express";

import { authLogin, authRegister } from "./routes/auth";
import { userCreate, userUpdate, userList, userDelete, userGet } from "./routes/user";
import { requireAuth } from "./middleware/requireAuth";
import logger from "./utils/logger";
import { authorize } from "./middleware/authorize";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello Express + TypeScript!");
});

app.post("/auth/register", authRegister);
app.post("/auth/login", authLogin);

app.post("/users", requireAuth, authorize('create', 'User'),userCreate);
app.get("/users",requireAuth, authorize('read', 'User'), userList);
app.get("/users/:id", requireAuth, userGet);
app.patch("/users/:id", requireAuth, authorize('update', 'User', (req :Request) => ({ id: req.params.id })),userUpdate);
app.delete("/users/:id", requireAuth, authorize('delete', 'User', (req :Request) => ({ id: req.params.id })), userDelete);

app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error("Server error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => logger.info(`Server working on http://localhost:${PORT}`));
