import { Component, createSignal, on, onCleanup } from "solid-js";
import { Todo } from "../../share/types";
import { dateDiff, nextReset } from "./reset_utils";

const useNow = () => {
  const [now, setNow] = createSignal(new Date());
  const timer = setInterval(() => setNow(new Date()), 1000);
  onCleanup(() => clearInterval(timer));
  return now;
};

export const TodoCheckbox: Component<{
  todo: Todo;
  setCompleted: (id: number, lastDone: Date | null) => void;
  rename: (id: number, text: string) => void;
  remove: (id: number) => void;
  loading: boolean;
}> = (props) => {
  const now = useNow();

  const completed = () => props.todo.lastDone && props.todo.lastDone <= now();

  function doRename() {
    const oldText = props.todo.text;
    let newText = prompt("Rename todo:", oldText);
    if (newText != null) {
      props.rename(props.todo.id, newText);
    }
  }

  function doRemove() {
    if (confirm(`Remove todo"${props.todo.text}"?`)) {
      props.remove(props.todo.id);
    }
  }

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
      <strong>{props.todo.text}</strong>{" "}
      {dateDiff(now(), nextReset(props.todo.reset, now()))}{" "}
      <button title="Rename todo" onClick={doRename}>
        🖉
      </button>
      <button title="Remove todo" onClick={doRemove}>
        🗑
      </button>
    </label>
  );
};
