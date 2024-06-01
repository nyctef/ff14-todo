import express, { Express, Request, Response } from "express";
import { todos } from "./api";

const app = express();
app.use(express.static("../web/dist"));
app.use(express.json());

app.get("/api/todos", (req: Request, res: Response) => {
  console.log("GET /api/todos");
  res.json(todos);
});

app.post("/api/todos/:id/completed", (req: Request, res: Response) => {
  console.log("POST /api/todos/:id/completed");
  const id = parseInt(req.params.id, 10);
  const completed = req.body.completed;

  const todo = todos.find((todo) => todo.id === id);
  if (!todo) {
    return res.sendStatus(404);
  }
  todo.lastDone = completed ? new Date() : null;

  res.sendStatus(204);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
