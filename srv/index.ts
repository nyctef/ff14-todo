import express, { Express, Request, Response } from "express";
import { todos } from "./api";
import { asyncHandler } from "./util";
import { Todo, TodoCreateRequest } from "../share/types";
import { resets } from "../share/resets";

class HttpError extends Error {
  // https://expressjs.com/en/guide/error-handling.html
  // express' default error handler will look for this property
  // to determine the status code
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

// TODO: move over into api file

let nextId = 2;

const api = {
  getTodos: async () => {
    return todos;
  },
  addTodo: async (req: TodoCreateRequest) => {
    // TODO: remove debug delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    const reset = resets.find((reset) => reset.name === req.resetName);
    if (!reset) {
      throw new HttpError(`Reset with name ${req.resetName} not found`, 400);
    }
    const todo: Todo = {
      id: nextId++,
      text: req.text,
      lastDone: null,
      reset,
    };
    todos.push(todo);
    return todo;
  },
  setTodoCompleted: async (id: number, completed: boolean) => {
    // TODO: remove debug delay
    await new Promise((resolve) => setTimeout(resolve, 200));
    const todo = todos.find((todo) => todo.id === id);
    if (!todo) {
      throw new HttpError(`Todo with id ${id} not found`, 404);
    }
    todo.lastDone = completed ? new Date() : null;
  },
};

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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
