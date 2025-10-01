import express, { Request, Response, NextFunction } from "express";
import { userCreate, userUpdate, userRemove, userDelete, userGet } from "./routes/user";
import logger from "./utils/logger";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello Express + TypeScript!");
});

app.post("/users", userCreate);
app.get("/users", userRemove);
app.get("/users/:id", userGet);
app.patch("/users/:id", userUpdate);
app.delete("/users/:id", userDelete);

app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Server error:', err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => logger.info(`Server working on http://localhost:${PORT}`));