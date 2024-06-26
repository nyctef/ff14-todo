import { Component, For } from "solid-js";
import { resets } from "../../share/resets";

export const NewTodoForm: Component<{
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
          data.get("reset_") as string
        );
        e.currentTarget.reset();
      }}
    >
      <input name="new_name" type="text" placeholder="add new todo" />
      {/* note we can't call this element `reset`,
          or that'll overwrite the form.reset() function */}
      <select name="reset_">
        <For each={resets}>
          {(reset) => <option value={reset.name}>{reset.name}</option>}
        </For>
      </select>
      <button type="submit">add</button>
    </form>
  );
};
