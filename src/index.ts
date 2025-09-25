import express, { Request, Response, NextFunction } from "express";
import { create as userCreate} from "./routes/user-create"
import { update as userUpdate} from "./routes/user-update"
import { list as userList} from "./routes/user-list"
import { _delete as userDelete} from "./routes/user-delete"
import {get as userGet} from "./routes/user-get"

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health
app.get("/", (req: Request, res: Response) => {
  
  res.send("Hello Express + TypeScript!");
  
});

// Create user
app.post("/users", (req: Request, res: Response) => userCreate(req, res));

// List users (with simple pagination)
app.get("/users",userList);

// Get user by id
app.get("/users/:id", (req: Request, res: Response) => userGet(req, res));

// Update user (partial)
app.patch("/users/:id", (req: Request, res: Response) => userUpdate(req, res));

// Delete user
app.delete("/users/:id", (req: Request, res: Response) => userDelete(req, res));

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => console.log(`Server working on http://localhost:${PORT}`));
