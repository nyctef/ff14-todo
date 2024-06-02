import { Todo, TodoCreateRequest } from "../share/types";

export interface Api {
  getTodos: () => Promise<Todo[]>;
  addTodo: (req: TodoCreateRequest) => Promise<Todo>;
  setTodoCompleted: (id: number, completed: boolean) => Promise<void>;
  renameTodo: (id: number, text: string) => Promise<void>;
  removeTodo: (id: number) => Promise<void>;
}
