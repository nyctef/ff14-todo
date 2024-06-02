import { Todo, TodoCreateRequest } from "../share/types";
import { Api } from "./api";
import pg from "pg";
import { resets } from "../share/resets";
import { HttpError } from "./error";

/*

CREATE TABLE events(
    id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    timestamp timestamptz DEFAULT current_timestamp,
    data jsonb
);

CREATE TABLE users(
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    username text UNIQUE NOT NULL,
    hashed_password text NOT NULL
);

CREATE TABLE sessions(
    id TEXT PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL,
    user_id integer NOT NULL REFERENCES users(id)
)

*/

interface EventStorage {
  store_event(event: TodoEvent): Promise<void>;
  get_events(): Promise<TodoEvent[]>;
}

type TodoEvent =
  | { type: "todo_added"; text: string; reset_name: string; timestamp: Date }
  | { type: "todo_checked"; text: string; timestamp: Date }
  | { type: "todo_unchecked"; text: string; timestamp: Date }
  | { type: "todo_removed"; text: string; timestamp: Date }
  | {
      type: "todo_renamed";
      old_text: string;
      new_text: string;
      timestamp: Date;
    };

export class PostgresEventStorage implements EventStorage {
  constructor(private client: pg.Client) {}

  static async create_from_env(): Promise<PostgresEventStorage> {
    const connectionString = process.env.FF14_TODO_PG_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error("FF14_TODO_PG_CONNECTION_STRING not set");
    }

    const client = new pg.Client(connectionString);
    await client.connect();

    return new PostgresEventStorage(client);
  }

  async store_event(event: TodoEvent): Promise<void> {
    await this.client.query("INSERT INTO events (data) VALUES ($1)", [event]);
  }
  async get_events(): Promise<TodoEvent[]> {
    const result = await this.client.query("SELECT data FROM events");
    return result.rows.map((row) => row.data);
  }
}

export class EventSourcedApi implements Api {
  storage: EventStorage;
  todos_data: Todo[];
  next_id: number;
  text_to_id: Map<string, number>;

  constructor(init_todos: Todo[], storage: EventStorage) {
    this.todos_data = init_todos;
    this.storage = storage;
    this.next_id = 1;
    this.text_to_id = new Map();
  }

  static async create(storage: EventStorage): Promise<EventSourcedApi> {
    const start = performance.now();
    const events = await storage.get_events();
    const impl = new EventSourcedApi([], storage);
    for (const event of events) {
      impl.#process_event(event);
    }
    console.log(
      `Loaded ${events.length} events in ${(performance.now() - start).toFixed(
        2
      )}ms`
    );
    return impl;
  }

  #getId(text: string): number {
    const existing_id = this.text_to_id.get(text);
    if (existing_id) {
      return existing_id;
    }
    const new_id = this.next_id++;
    this.text_to_id.set(text, new_id);
    return new_id;
  }

  #process_event(event: TodoEvent): void {
    switch (event.type) {
      case "todo_added":
        const reset = resets.find((reset) => reset.name === event.reset_name);
        if (!reset) {
          throw new HttpError(
            `Reset with name ${event.reset_name} not found`,
            400
          );
        }

        this.todos_data.push({
          text: event.text,
          lastDone: null,
          reset: reset,
          id: this.#getId(event.text),
        });
        break;
      case "todo_checked":
        this.todos_data = this.todos_data.map((t) =>
          t.text == event.text ? { ...t, lastDone: event.timestamp } : t
        );
        break;
      case "todo_unchecked":
        this.todos_data = this.todos_data.map((t) =>
          t.text == event.text ? { ...t, lastDone: null } : t
        );
        break;
      case "todo_removed":
        this.todos_data = this.todos_data.filter((t) => t.text != event.text);
        break;
      case "todo_renamed":
        this.todos_data = this.todos_data.map((t) =>
          t.text == event.old_text ? { ...t, text: event.new_text } : t
        );
        break;
      default:
        throw Error(`Unknown event type: ${(event as any).type}`);
    }
  }

  getTodos(): Promise<Todo[]> {
    return Promise.resolve(this.todos_data);
  }

  async addTodo(new_todo: TodoCreateRequest): Promise<Todo> {
    const event = {
      type: "todo_added",
      text: new_todo.text,
      timestamp: new Date(),
      reset_name: new_todo.resetName,
    } as const;
    await this.storage.store_event(event);
    this.#process_event(event);
    // todo: error handling
    return this.todos_data.find((t) => t.text == new_todo.text)!;
  }

  async setTodoCompleted(id: number, completed: boolean): Promise<void> {
    // todo: check for missing id
    const todo_name = this.todos_data.find((t) => t.id == id)!.text;
    const event = {
      type: completed ? "todo_checked" : "todo_unchecked",
      text: todo_name,
      timestamp: new Date(),
    } as const;
    await this.storage.store_event(event);
    this.#process_event(event);
  }

  async removeTodo(id: number): Promise<void> {
    const todo_name = this.todos_data.find((t) => t.id == id)!.text;
    const event = {
      type: "todo_removed",
      text: todo_name,
      timestamp: new Date(),
    } as const;
    await this.storage.store_event(event);
    this.#process_event(event);
  }
  async renameTodo(id: number, new_text: string): Promise<void> {
    const old_text = this.todos_data.find((t) => t.id == id)!.text;
    const event = {
      type: "todo_renamed",
      old_text,
      new_text,
      timestamp: new Date(),
    } as const;
    await this.storage.store_event(event);
    this.#process_event(event);
  }
}
