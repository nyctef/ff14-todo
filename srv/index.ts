import express, { Express, NextFunction, Request, Response } from "express";
import { api } from "./api";
import { asyncHandler } from "./util";
import { HttpError } from "./error";

const app = express();
app.use(express.static("../web/dist"));
app.use(express.json());

app.get(
  "/api/todos",
  asyncHandler(async (req, res, next) => {
    console.log("GET /api/todos");
    res.json(await api.getTodos().catch(next));
  })
);

app.post(
  "/api/todos",
  asyncHandler(async (req, res) => {
    console.log("POST /api/todos");
    const toCreate = req.body;

    // TODO: validate request body using io-ts or something
    const todo = await api.addTodo(toCreate);

    res.status(201).json(todo);
  })
);

app.post(
  "/api/todos/:id/completed",
  asyncHandler(async (req, res) => {
    console.log("POST /api/todos/:id/completed");
    const id = parseInt(req.params.id, 10);
    const completed = req.body.completed;

    await api.setTodoCompleted(id, completed);

    res.sendStatus(204);
  })
);

app.post(
  "/api/todos/:id/name",
  asyncHandler(async (req, res) => {
    console.log("POST /api/todos/:id/name");
    const id = parseInt(req.params.id, 10);
    const text = req.body.text;

    await api.renameTodo(id, text);

    res.sendStatus(204);
  })
);

app.delete(
  "/api/todos/:id",
  asyncHandler(async (req, res) => {
    console.log("DELETE /api/todos/:id");
    const id = parseInt(req.params.id, 10);

    await api.removeTodo(id);

    res.sendStatus(204);
  })
);

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  // https://expressjs.com/en/guide/error-handling.html
  if (res.headersSent) {
    return next(err);
  }
  if (req.path.startsWith("/api") && err instanceof HttpError) {
    console.error(err);
    return res.status(err.statusCode).json({ error: err.message });
  }

  return next(err);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
