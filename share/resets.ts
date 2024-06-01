import { Reset } from "./types";

export const resets: Reset[] = [
  { name: "Weekly reset", interval: "weekly", hourOffset: 24 + 8 },
  { name: "Duty reset", interval: "daily", hourOffset: 15 },
  { name: "GC Supply reset", interval: "daily", hourOffset: 20 },
  { name: "Jumbo Cactpot reset", interval: "weekly", hourOffset: 5 * 24 + 19 },
  { name: "Island Sanctuary reset", interval: "daily", hourOffset: 8 },
];
