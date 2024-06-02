import { For, createSignal, onMount, type Component } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { Todo } from "../../share/types";
import { apiClient } from "./apiClient";
import { TodoCheckbox } from "./TodoCheckbox";
import { NewTodoForm } from "./NewTodoForm";

const App: Component = () => {
  const [todos, setTodos] = createStore<Todo[]>([]);
  const [loading, setLoading] = createSignal(false);

  onMount(async () => {
    const todos = await apiClient.getTodos();
    setTodos(reconcile(todos));
  });

  async function createTodo(text: string, resetName: string) {
    setLoading(true);
    const newTodo = await apiClient.createTodo(text, resetName);
    setTodos(todos.length, newTodo);

    // TODO: try/finally here + error handling
    setLoading(false);
  }

  async function setTodoCompleted(id: number, value: Date | null) {
    setLoading(true);
    await apiClient.setTodoCompleted(id, value);
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
