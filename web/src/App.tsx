import { For, createResource, type Component } from "solid-js";
import { Todo } from "../../share/types";

const TodoCheckbox: Component<{
  todo: Todo;
  setCompleted: (value: boolean) => void;
}> = (props) => {
  const completed = () =>
    props.todo.lastDone && props.todo.lastDone <= new Date();

  return (
    <label>
      <input
        type="checkbox"
        checked={completed()}
        onChange={(e) => {
          // doesn't seem like `e.preventDefault()` or `return false` works here
          // need to immediately reset the checkbox to its previous state
          e.target.checked = completed();
          props.setCompleted(!completed());
        }}
      />
      {props.todo.text}
    </label>
  );
};

const App: Component = () => {
  const [todos, { refetch }] = createResource(async () => {
    const response = (await (await fetch("/api/todos")).json()) as Todo[];
    const todos = response.map((todo) => ({
      ...todo,
      lastDone: todo.lastDone ? new Date(todo.lastDone) : null,
    }));
    console.log({ todos });
    return todos;
  });

  async function setTodoCompleted(id: number, value: boolean) {
    console.log(`TODO: set ${id} ${value}`);
    await fetch(`/api/todos/${id}/completed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: value }),
    });
    // TODO: avoid double roundtrip to api
    refetch();
  }

  return (
    <>
      <h1>FF14 TODOs</h1>
      <ul>
        <For each={todos()} fallback={<li>Loading...</li>}>
          {(todo) => (
            <li>
              <TodoCheckbox
                todo={todo}
                setCompleted={(x) => setTodoCompleted(todo.id, x)}
              />
            </li>
          )}
        </For>
      </ul>
    </>
  );
};

export default App;
