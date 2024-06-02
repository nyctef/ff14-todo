import { Component } from "solid-js";
import { Todo } from "../../share/types";

export const TodoCheckbox: Component<{
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
