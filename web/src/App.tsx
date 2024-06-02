import {
  For,
  createEffect,
  createSignal,
  onMount,
  type Component,
} from "solid-js";
import { createStore, reconcile, unwrap } from "solid-js/store";
import { Todo } from "../../share/types";
import { apiClient } from "./apiClient";
import { TodoCheckbox } from "./TodoCheckbox";
import { NewTodoForm } from "./NewTodoForm";
import { is_done, millis_remaining } from "./reset_utils";
import { useNow } from "./useNow";

const App: Component = () => {
  const [todos, setTodos] = createStore<Todo[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const now = useNow();

  onMount(async () => {
    const todos = await apiClient.getTodos();
    setTodos(reconcile(todos));
  });

  function handleErrors<TIn extends any[], TOut>(
    fn: (...input: TIn) => Promise<TOut>
  ) {
    return async (...input: TIn) => {
      try {
        setLoading(true);
        return await fn(...input);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
  }

  async function createTodo(text: string, resetName: string) {
    const newTodo = await apiClient.createTodo(text, resetName);
    setTodos(todos.length, newTodo);
  }

  async function setTodoCompleted(id: number, value: Date | null) {
    await apiClient.setTodoCompleted(id, value);
    setTodos((t) => t.id === id, { lastDone: value });
  }

  async function renameTodo(id: number, text: string) {
    await apiClient.renameTodo(id, text);
    setTodos((t) => t.id === id, { text });
  }

  async function removeTodo(id: number) {
    await apiClient.removeTodo(id);
    setTodos(todos.filter((t) => t.id !== id));
  }

  function sort_is_done(a: boolean, b: boolean) {
    // return 1 if `a` is done ("greater" than b so should be sorted later)
    return a === b ? 0 : a ? 1 : -1;
  }

  // TODO: sorting should probably have some unit tests - definitely
  // got this wrong the last time
  const sortedTodos = () =>
    todos.slice().sort(
      (a, b) =>
        // `||` here will return the first non-zero comparison result
        sort_is_done(is_done(a, now()), is_done(b, now())) ||
        millis_remaining(a, now()) - millis_remaining(b, now()) ||
        a.text.localeCompare(b.text)
    );

  return (
    <>
      <h1>FF14 TODOs</h1>
      <ul>
        <For each={sortedTodos()} fallback={<li>Loading...</li>}>
          {(todo) => (
            <li>
              <TodoCheckbox
                todo={todo}
                setCompleted={handleErrors(setTodoCompleted)}
                rename={handleErrors(renameTodo)}
                remove={handleErrors(removeTodo)}
                loading={loading()}
              />
            </li>
          )}
        </For>
      </ul>
      <NewTodoForm createTodo={handleErrors(createTodo)} />
      {error() && <p style="color: red">{error()}</p>}
    </>
  );
};

export default App;
