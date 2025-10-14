// Type definitions
export type Action = () => State;
export type State = () => Record<string, Action>;
export type Machine<S extends State = State> = {
  state: State;
  cleanups: Array<Function>;
} & {
  [K in keyof ReturnType<S>]: () => Machine<ReturnType<ReturnType<S>[K]>> &
    Machine;
};

let currentMachine: Machine | null = null;

export const run = (initial: State, onChange?: (res: Machine) => void) => {
  const parse = (state: State) =>
    Object.fromEntries(
      Object.entries(() => {
        currentMachine = res;
        const s = state();
        currentMachine = null;
        return s;
      }).map(([key, action]) => [
        key,
        () => {
          Object.assign(res, parse(res.state));
          res.state = action();
          res.cleanups.forEach((fn) => fn());
          onChange?.(res);
          return res;
        },
      ])
    );
  const res = {
    ...parse(initial),
    cleanups: [],
    state: initial,
  } as unknown as Machine;
  return res;
};

export const cleanup = (func: Function) => {
  if (!currentMachine) throw "you can only run cleanup inside a state";
  currentMachine.cleanups.push(func);
};

export const wait = (ms: number, fn: Function) => {
  const timeout = setTimeout(fn, ms);
  cleanup(() => clearTimeout(timeout));
  return timeout;
};
