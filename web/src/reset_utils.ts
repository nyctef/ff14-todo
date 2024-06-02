import type { Reset, Todo } from "../../share/types";

/** Get a time near 00:01 on the current day */
function floorDay(date: Date): Date {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

/** Get a time near 00:01 the previous Monday */
function floorWeek(date: Date): Date {
  const result = new Date(date);
  // .getDay() returns the day of the week (zero-indexed on Sunday)
  // so we add 1 to make it zero-indexed on Monday.
  // .setDate() is kind to us and does a useful thing even if the
  // resulting day-of-month is negative.
  result.setUTCDate(result.getUTCDate() - result.getUTCDay() + 1);
  return floorDay(result);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setUTCHours(result.getUTCHours() + hours);
  return result;
}

/** Imagine a timeline like the following:

    --|----R----|----R----|
    --  ^a   ^b

where `|` indicates the interval (day/week) boundaries
and R indicates the time of the reset within that interval.

The current time is either a or b: in our current interval, we're
either before or after the reset in that interval.
In case a, we just use the reset in the current interval:
otherwise we jump ahead one interval and use that reset as
next one instead. */
export function nextReset(reset: Reset, currentTime: Date): Date {
  const startOfCurrentInterval =
    reset.interval == "weekly" ? floorWeek(currentTime) : floorDay(currentTime);

  const startOfNextInterval =
    reset.interval === "weekly"
      ? addDays(startOfCurrentInterval, 7)
      : addDays(startOfCurrentInterval, 1);

  const resetInCurrentInterval = addHours(
    startOfCurrentInterval,
    reset.hourOffset
  );

  const resetInNextInterval = addHours(startOfNextInterval, reset.hourOffset);

  if (currentTime < resetInCurrentInterval) {
    return resetInCurrentInterval;
  } else {
    return resetInNextInterval;
  }
}

/** same as `nextReset`, but with this timeline instead:

    --|----R----|----R----|
    --            ^a   ^b

and searching backwards instead of forwards.
 */
export function prevReset(reset: Reset, currentTime: Date): Date {
  const startOfCurrentInterval =
    reset.interval == "weekly" ? floorWeek(currentTime) : floorDay(currentTime);

  const startOfPrevInterval =
    reset.interval === "weekly"
      ? addDays(startOfCurrentInterval, -7)
      : addDays(startOfCurrentInterval, -1);

  const resetInCurrentInterval = addHours(
    startOfCurrentInterval,
    reset.hourOffset
  );

  const resetInPrevInterval = addHours(startOfPrevInterval, reset.hourOffset);

  if (currentTime > resetInCurrentInterval) {
    return resetInCurrentInterval;
  } else {
    return resetInPrevInterval;
  }
}

/** Difference between two dates for displaying in the UI.
 Positive if `to` is later than `from`.

 Doesn't take into account timezones, DST, leap seconds etc
 so may give the wrong answer in some edge cases.

 We're probably assuming all the incoming dates are UTC
 so hopefully this isn't too much of an issue.
 */
export function dateDiff(from: Date, to: Date): string {
  let msDiff = to.getTime() - from.getTime();
  let sign = "";
  if (msDiff < 0) {
    sign = "-";
    msDiff = -msDiff;
  }
  // const seconds = Math.floor(msDiff / 1000) % 60;
  const minutes = Math.floor(msDiff / 1000 / 60) % 60;
  const hours = Math.floor(msDiff / 1000 / 60 / 60) % 24;
  const days = Math.floor(msDiff / 1000 / 60 / 60 / 24);

  const pad = (x: number) => String(x).padStart(2, "0");
  if (days > 0) {
    return `${sign}${pad(days)}d ${pad(hours)}h`;
  } else {
    return `${sign}${pad(hours)}h ${pad(minutes)}m`;
  }
  // we probably don't need sub-minute precision since
  // if that matters for this use case it's probably too late anyway
}

export function millis_remaining(todo: Todo, time: Date): number {
  return nextReset(todo.reset, time).getTime() - time.getTime();
}

export function is_done(todo: Todo, time: Date) {
  return (
    todo.lastDone != undefined &&
    new Date(todo.lastDone) >= prevReset(todo.reset, time)
  );
}

const internals = { floorDay, floorWeek, dateDiff };
export { internals };
