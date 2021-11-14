import { configureStore, createSlice, getDefaultMiddleware, isPlain } from "@reduxjs/toolkit"
import { immerable, isDraftable } from "immer"
import { Euler, Object3D, Quaternion, Vector2, Vector3, Vector4 } from "three"

/**
 * Mark classes as copyable by immer, which also make the middleware treat them
 * as serializable.
 */
function markImmerable() {
  const mark = (constructor: any) => (constructor[immerable] = true)
  void [Quaternion, Vector2, Vector3, Vector4].map(mark)
}
markImmerable()

export type State = {
  borderWidth: number
  spacemap: {
    position: Vector3
    quaternion: Quaternion
    scale: Vector3
    pixelsPerUnit: Vector2
    pixelsPerDegree: number
  }
}

const initialState: State = {
  borderWidth: 0.5,
  spacemap: {
    position: new Vector3(0, 0.1, 0),
    scale: new Vector3(2, 2, 1),
    /** Screen pixels per unit movement in position */
    pixelsPerUnit: new Vector2(-5e2, 5e2),
    /** Screen pixels per degree rotation (right-handed about z) */
    pixelsPerDegree: -50,
    quaternion: new Quaternion()
  }
}

interface Coords {
  position: Vector3
  quaternion: Quaternion
  scale: Vector3
}

class Object3DCoords extends Object3D {
  from(coords: Coords) {
    this.position.copy(coords.position)
    this.quaternion.copy(coords.quaternion)
    this.scale.copy(coords.scale)
    return this
  }

  to(coords: Coords) {
    coords.position.copy(this.position)
    coords.quaternion.copy(this.quaternion)
    coords.scale.copy(this.scale)
  }
}

const o = new Object3DCoords()

const slice = createSlice({
  name: "studio",
  initialState,
  reducers: {
    setBorderWidth(state, { payload: borderWidth }) {
      state.borderWidth = borderWidth
    },
    translate({ spacemap }, { payload: { dx, dy } }) {
      const ppu = spacemap.pixelsPerUnit
      spacemap.position.x += dx / ppu.x
      spacemap.position.y += dy / ppu.y
    },
    rotate({ spacemap }, { payload: distance }) {
      o.from(spacemap)
        .rotateZ(((distance / spacemap.pixelsPerDegree) * Math.PI) / 180.0)
        .to(spacemap)
    }
  }
})

export const { setBorderWidth, rotate, translate } = slice.actions
const reducer = slice.reducer
export default reducer
export const createModel = () =>
  configureStore({
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        /** Allow plain JSON and immerable objects */
        serializableCheck: {
          isSerializable: (value: any) => isPlain(value) || isDraftable(value)
        } as any
      }),
    reducer
  })

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
