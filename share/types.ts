export type Reset = {
  name: string;
  interval: "daily" | "weekly";
  hourOffset: number;
};

export type Todo = {
  id: number;
  text: string;
  lastDone: Date | null;
  reset: Reset;
};

export type TodoCreateRequest = {
  text: string;
  resetName: string;
};
