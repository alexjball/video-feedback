import { isEqual } from "lodash"
import { shallowEqual } from "react-redux"

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

  /**
   * Binds a handler to a part of the state tree. When state is applied to the
   * binder, it computes `selector(state)`. On the first apply and whenever
   * state changes, as determined by `isEqual`, the `bind` handler is called
   * with the selected state.
   */
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
