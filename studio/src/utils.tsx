import { createContext, useContext } from "react"

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

/** Creates a context provider and access hook from a factory function. */
export function createScope<Ctx>(factory: () => Ctx): {
  Provider: React.FC
  useContext: () => Ctx | Empty
} {
  const Context = createContext<Ctx | Empty>({})
  return {
    Provider({ children }) {
      return <Context.Provider value={factory()}>{children}</Context.Provider>
    },
    useContext() {
      return useContext(Context)
    }
  }
}
