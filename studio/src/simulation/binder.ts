type Selector<S, T> = (state: S) => T
type Bind<T> = (value: T) => void
type IsEqual<T> = (a: T, b: T) => boolean
const byReference: IsEqual<any> = (a, b) => a === b

/** Simple handlers for parts of the state tree */
export default class Binder<S> {
  private readonly binders: Bind<S>[] = []

  apply(state: S) {
    this.binders.forEach(bind => bind(state))
  }

  add<T>(selector: Selector<S, T>, bind: Bind<T>, isEqual: IsEqual<T> = byReference) {
    let prev: { value: T }
    this.binders.push(state => {
      const curr = selector(state)
      if (!prev || !isEqual(prev.value, curr)) {
        bind(curr)
        prev = { value: curr }
      }
    })
    return this
  }
}
