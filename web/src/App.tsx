import {
  For,
  createResource,
  createSignal,
  onMount,
  type Component,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { Todo, TodoCreateRequest } from "../../share/types";
import { resets } from "../../share/resets";

const TodoCheckbox: Component<{
  todo: Todo;
  setCompleted: (id: number, lastDone: Date | null) => void;
  loading: boolean;
}> = (props) => {
  const completed = () =>
    props.todo.lastDone && props.todo.lastDone <= new Date();

  return (
    <label>
      <input
        disabled={props.loading}
        type="checkbox"
        checked={completed()}
        onChange={(e) => {
          const wasCompleted = completed();
          // doesn't seem like `e.preventDefault()` or `return false` works here
          // need to immediately reset the checkbox to its previous state
          e.target.checked = wasCompleted;
          props.setCompleted(props.todo.id, wasCompleted ? null : new Date());
        }}
      />
      {props.todo.text}
    </label>
  );
};

const NewTodoForm: Component<{
  createTodo: (text: string, resetName: string) => void;
}> = (props) => {
  return (
    <form
      method="post"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        props.createTodo(
          data.get("new_name") as string,
          data.get("reset") as string
        );
      }}
    >
      <input name="new_name" type="text" placeholder="add new todo" />
      <select name="reset">
        <For each={resets}>
          {(reset) => <option value={reset.name}>{reset.name}</option>}
        </For>
      </select>
      <button type="submit">add</button>
    </form>
  );
};

const App: Component = () => {
  const [todos, setTodos] = createStore<Todo[]>([]);
  const [loading, setLoading] = createSignal(false);

  onMount(async () => {
    const response = (await (await fetch("/api/todos")).json()) as Todo[];
    const todos = response.map((todo) => ({
      ...todo,
      // dates will be serialized in json as strings,
      // so we need to convert them back
      lastDone: todo.lastDone ? new Date(todo.lastDone) : null,
    }));
    console.log({ todos });
    setTodos(reconcile(todos));
  });

  async function createTodo(text: string, resetName: string) {
    setLoading(true);
    const body: TodoCreateRequest = { text, resetName };
    const response = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((res) => res.json());
    // TODO: validate response shape using io-ts or similar
    setTodos(todos.length, response);
    setLoading(false);
  }

  async function setTodoCompleted(id: number, value: Date | null) {
    setLoading(true);
    await fetch(`/api/todos/${id}/completed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: value }),
    });
    setTodos((t) => t.id === id, { lastDone: value });
    setLoading(false);
  }

  return (
    <>
      <h1>FF14 TODOs</h1>
      <ul>
        <For each={todos} fallback={<li>Loading...</li>}>
          {(todo) => (
            <li>
              <TodoCheckbox
                todo={todo}
                setCompleted={setTodoCompleted}
                loading={loading()}
              />
            </li>
          )}
        </For>
      </ul>
      <NewTodoForm createTodo={createTodo} />
    </>
  );
};

export default App;
