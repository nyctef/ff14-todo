import { Todo, TodoCreateRequest } from "../../share/types";

export const apiClient = {
  async getTodos() {
    const response = (await (await fetch("/api/todos")).json()) as Todo[];
    const todos = response.map((todo) => ({
      ...todo,
      // dates will be serialized in json as strings,
      // so we need to convert them back
      lastDone: todo.lastDone ? new Date(todo.lastDone) : null,
    }));
    console.log({ todos });
    return todos;
  },

  async createTodo(text: string, resetName: string): Promise<Todo> {
    const body: TodoCreateRequest = { text, resetName };
    const response = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((res) => res.json());
    // TODO: validate response shape using io-ts or similar
    return response;
  },

  async setTodoCompleted(id: number, value: Date | null) {
    await fetch(`/api/todos/${id}/completed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: value }),
    });
  },
};
