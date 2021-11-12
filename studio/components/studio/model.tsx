import { configureStore, createSlice } from "@reduxjs/toolkit"
import { Vector3 } from "three"

export type State = {
  borderWidth: number
  spacemap: {
    position: Vector3
    scale: Vector3
  }
}

const initialState: State = {
  borderWidth: 0.5,
  spacemap: {
    position: new Vector3(0, 0.1, 0),
    scale: new Vector3(2, 2, 1)
  }
}

const slice = createSlice({
  name: "studio",
  initialState,
  reducers: {
    setBorderWidth(state, { payload: borderWidth }) {
      state.borderWidth = borderWidth
    }
  }
})

export const { setBorderWidth } = slice.actions
const reducer = slice.reducer
export default reducer
export const createModel = () => configureStore({ reducer })

type Selector<S, T> = (state: S) => T
type Bind<T> = (value: T) => void
type IsEqual<T> = (a: T, b: T) => boolean
const byReference: IsEqual<any> = (a, b) => a === b

export class Binder<S> {
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
