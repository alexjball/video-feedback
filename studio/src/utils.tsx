import { createContext, DependencyList, useContext, useEffect, useMemo, useState } from "react"
import { shallowEqual } from "react-redux"
import { isEqual } from "lodash"

type Selector<S, T> = (state: S) => T
type Bind<T> = (value: T) => void
type IsEqual<T> = (a: T, b: T) => boolean

export const byReference: IsEqual<any> = (a, b) => a === b,
  byShallowEqual: IsEqual<any> = shallowEqual,
  byDeepEqual: IsEqual<any> = isEqual

/** Simple handlers for parts of the state tree */
export class Binder<S> {
  private readonly binders: Bind<S>[] = []

  /** Returns true if any binders were applied */
  apply(state: S) {
    return this.binders.map(bind => bind(state)).some(Boolean)
  }

  add<T>(selector: Selector<S, T>, bind: Bind<T>, isEqual: IsEqual<T> = byDeepEqual) {
    let prev: { value: T }
    this.binders.push(state => {
      const curr = selector(state)
      if (!prev || !isEqual(prev.value, curr)) {
        bind(curr)
        prev = { value: curr }
        return true
      } else {
        return false
      }
    })
    return this
  }
}

/** Type of an empty object literal `{}` */
type Empty = Record<string, never>
type Maybe<T> = T | Empty
type Setter<T> = (s: T) => void

/** Creates a service context and access hooks. */
export function createService<Service>(providerHook?: () => Service): {
  Provider: React.FC
  useService: () => Maybe<Service>
  useBinding: (impl: Service) => void
} {
  const Context = createContext<{ value: Maybe<Service>; setValue: Setter<Maybe<Service>> }>({
    value: {},
    setValue() {
      throw Error("No provider found")
    }
  })

  return {
    Provider({ children }) {
      const providerValue = providerHook?.()
      const [value, setValue] = useState<Maybe<Service>>({})

      return (
        <Context.Provider
          value={useMemo(
            () => ({ value: providerValue ?? value, setValue }),
            [providerValue, value]
          )}>
          {children}
        </Context.Provider>
      )
    },

    useBinding(impl: Service) {
      const { setValue } = useContext(Context)
      useEffect(() => {
        setValue(impl)
        return () => setValue({})
      }, [impl, setValue])
    },

    useService() {
      return useContext(Context).value
    }
  }
}

export function isDefined<T>(v: T | undefined): v is T {
  return v !== undefined
}

export type Resolve<T> = (v: T) => void
export type Reject = (e: any) => void
export type SettablePromise<T> = Promise<T> & { resolve: Resolve<T>; reject: Reject }

export function settablePromise<T>(): SettablePromise<T> {
  let resolve, reject
  const p: any = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  p.resolve = resolve
  p.reject = reject
  return p
}

export function useSingleton<T>(Class: { new (): T }, deps: DependencyList) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => new Class(), deps)
}

export function singleton<T>(Class: { new (): T }) {
  return new Class()
}
