import { createContext, useContext, useEffect, useMemo, useState } from "react"

type Selector<S, T> = (state: S) => T
type Bind<T> = (value: T) => void
type IsEqual<T> = (a: T, b: T) => boolean
const byReference: IsEqual<any> = (a, b) => a === b

/** Simple handlers for parts of the state tree */
export class Binder<S> {
  private readonly binders: Bind<S>[] = []

  /** Returns true if any binders were applied */
  apply(state: S) {
    return this.binders.map(bind => bind(state)).some(Boolean)
  }

  add<T>(selector: Selector<S, T>, bind: Bind<T>, isEqual: IsEqual<T> = byReference) {
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
