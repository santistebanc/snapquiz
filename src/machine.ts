export type StateConfig = Record<string, Function> & { init?: Function }
export type Config = Record<string, StateConfig>

type AllKeys<T> = T extends Record<string, infer U> ? U extends Record<string, any> ? keyof U : never : never

export type Router<C extends Config> = {
    [K in AllKeys<C>]: (...args: any[]) => void
} & {
    [K in keyof C as `to${Capitalize<string & K>}`]: () => void
} & {
    state: keyof C
    cleanups: Array<Function>,
    config: C
}

let currentRouter: any = null;

export function router<C extends Config = {}>(this: any, config: C, initial: keyof C, onTransition?: (res: Router<C>) => any) {
    const res = {
        state: initial,
        cleanups: [] as Function[],
        config,
    } as Router<C>

    Object.entries(config).forEach(([state, action]) => {
        (res as any)[`to${state.charAt(0).toUpperCase() + state.slice(1)}`] = function(this: any) {
            res.cleanups.forEach((cleanup) => cleanup.call(this))
            res.state = state
            currentRouter = res
            res.config[state].init?.call(this)
            currentRouter = null
            onTransition?.call(this, res)
        }.bind(this)
        Object.keys(action).forEach((key) => {
            (res as any)[key] = function(this: any, ...args: any[]) { config[res.state][key].call(this, ...args) }.bind(this)
        })
    })
    currentRouter = res
    res.config[initial].init?.call(this)
    currentRouter = null
    return res
}

export const cleanup = (func: Function) => {
    if (!currentRouter) throw "you can only run cleanup inside a state";
    currentRouter.cleanups.push(func);
};

export const timeout = (ms: number, fn: Function) => {
    const timeout = setTimeout(fn, ms);
    cleanup(() => clearTimeout(timeout));
    return timeout;
};


export type StateFrom<M> = M extends { config: infer C } ? keyof C : never

export const store = <I extends Record<string | symbol, any>>(initial: I, onChange?: Function) => {
    let handleChange: Function = onChange ?? (() => { });
    let timeout: any = null
    const scheduleChange = () => {
        if (!timeout) {
            timeout = setTimeout(() => {
                handleChange?.()
                clearTimeout(timeout)
                timeout = null
            }, 0)
        }
    }
    const memo = new Proxy(initial, {
        get: (target, prop) => {
            if (prop === Symbol.toPrimitive) {
                return () => initial
            }
            if (!onChange && prop === 'onChange') {
                return (handler: Function) => {
                    handleChange = handler
                    return memo
                }
            }
            const res = target[prop]
            if (typeof res === 'object' && res !== null) {
                return store(res, handleChange)
            }
            return res
        },
        set: (target, prop, value) => {
            if (typeof value === 'object' && value !== null) {
                (target as any)[prop] = store(value, handleChange)
            } else {
                (target as any)[prop] = value
            }
            scheduleChange()
            return true
        },
        deleteProperty(target, prop) {
            scheduleChange()
            return delete target[prop];
        }
    })
    type Res = I & { onChange: (handler: Function) => Res }
    return memo as Res
}