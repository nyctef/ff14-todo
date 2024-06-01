import { Todo, Reset } from "../share/types";

const am7: Reset = {
  name: "7AM",
  interval: "daily",
  hourOffset: 7,
};
export const todos: Todo[] = [
  { id: 1, text: "Buy milk", lastDone: null, reset: am7 },
];
