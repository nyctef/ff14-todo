import { resets } from "../share/resets";
import { Todo, Reset, TodoCreateRequest } from "../share/types";
import { HttpError } from "./error";

const am7: Reset = {
  name: "7AM",
  interval: "daily",
  hourOffset: 7,
};
const todos: Todo[] = [{ id: 1, text: "Buy milk", lastDone: null, reset: am7 }];

let nextId = 2;

export const api = {
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
  renameTodo: async (id: number, text: string) => {
    // TODO: remove debug delay
    await new Promise((resolve) => setTimeout(resolve, 200));
    const todo = todos.find((todo) => todo.id === id);
    if (!todo) {
      throw new HttpError(`Todo with id ${id} not found`, 404);
    }
    todo.text = text;
  },
  removeTodo: async (id: number) => {
    // TODO: remove debug delay
    await new Promise((resolve) => setTimeout(resolve, 200));
    const index = todos.findIndex((todo) => todo.id === id);
    if (index === -1) {
      throw new HttpError(`Todo with id ${id} not found`, 404);
    }
    todos.splice(index, 1);
  },
};
