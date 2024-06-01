import { For, createResource, onMount, type Component } from "solid-js";
import { createStore } from "solid-js/store";
import { Todo } from "../../share/types";

const TodoCheckbox: Component<{
  todo: Todo;
  setCompleted: (id: number, lastDone: Date | null) => void;
}> = (props) => {
  const completed = () =>
    props.todo.lastDone && props.todo.lastDone <= new Date();

  return (
    <label>
      <input
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

const App: Component = () => {
  const [todos, setTodos] = createStore<Todo[]>([]);
  onMount(async () => {
    const response = (await (await fetch("/api/todos")).json()) as Todo[];
    const todos = response.map((todo) => ({
      ...todo,
      // dates will be serialized in json as strings,
      // so we need to convert them back
      lastDone: todo.lastDone ? new Date(todo.lastDone) : null,
    }));
    console.log({ todos });
    setTodos(todos);
  });

  async function setTodoCompleted(id: number, value: Date | null) {
    console.log(`TODO: set ${id} ${value}`);
    await fetch(`/api/todos/${id}/completed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: value }),
    });
    setTodos((t) => t.id === id, { lastDone: value });
  }

  return (
    <>
      <h1>FF14 TODOs</h1>
      <ul>
        <For each={todos} fallback={<li>Loading...</li>}>
          {(todo) => (
            <li>
              <TodoCheckbox todo={todo} setCompleted={setTodoCompleted} />
            </li>
          )}
        </For>
      </ul>
    </>
  );
};

export default App;
