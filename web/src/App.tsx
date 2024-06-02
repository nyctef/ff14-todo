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

  function handleErrors<TIn extends any[], TOut>(
    fn: (...input: TIn) => Promise<TOut>
  ) {
    return async (...input: TIn) => {
      try {
        setLoading(true);
        return await fn(...input);
      } catch (e) {
        console.error(e);
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

  return (
    <>
      <h1>FF14 TODOs</h1>
      <ul>
        <For each={todos} fallback={<li>Loading...</li>}>
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
      <NewTodoForm createTodo={createTodo} />
    </>
  );
};

export default App;
