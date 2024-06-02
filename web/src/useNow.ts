import { createSignal, onCleanup } from "solid-js";

export const useNow = () => {
  const [now, setNow] = createSignal(new Date());
  const timer = setInterval(() => setNow(new Date()), 1000);
  onCleanup(() => clearInterval(timer));
  return now;
};
