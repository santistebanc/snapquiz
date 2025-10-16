export type StateConfig = Record<string, Function> & { init?: Function }
export type Config = Record<string, StateConfig>

type AllKeys<T> = T extends Record<string, infer U> ? U extends Record<string, any> ? keyof U : never : never

export type Machine<C extends Config> = {
    [K in AllKeys<C>]: (...args: any[]) => void
} & {
    [K in keyof C as `to${Capitalize<string & K>}`]: () => void
} & {
    state: keyof C
    cleanups: Array<Function>,
    config: C
}

let currentMachine: any = null;

export const machine = <C extends Config = {}>(config: C, initial: keyof C, onTransition?: (res: Machine<C>) => void) => {

    const res = {
        state: initial,
        cleanups: [] as Function[],
        config,
    } as Machine<C>

    Object.entries(config).forEach(([state, action]) => {
        (res as any)[`to${state.charAt(0).toUpperCase() + state.slice(1)}`] = () => {
            res.cleanups.forEach((cleanup) => cleanup())
            res.state = state
            currentMachine = res
            res.config[state].init?.()
            currentMachine = null
            onTransition?.(res)
        }
        Object.keys(action).forEach((key) => {
            (res as any)[key] = (...args: any[]) => { config[res.state][key](...args) }
        })
    })
    currentMachine = res
    res.config[initial].init?.()
    currentMachine = null
    return res
}

export const cleanup = (func: Function) => {
    if (!currentMachine) throw "you can only run cleanup inside a state";
    currentMachine.cleanups.push(func);
};

export const timeout = (ms: number, fn: Function) => {
    const timeout = setTimeout(fn, ms);
    cleanup(() => clearTimeout(timeout));
    return timeout;
};


export type StateFrom<M> = M extends { config: infer C } ? keyof C : never
