import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { immerable } from "immer"
import { useCallback } from "react"
import { Object3D, Quaternion, Vector2, Vector3, Vector4 } from "three"
import { useAppSelector, useAppStore } from "../hooks"

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
    pixelsPerScale: number
  }
}

const initialState: State = {
  borderWidth: 0.5,
  spacemap: {
    position: new Vector3(0, 0.1, 0),
    scale: new Vector3(2, 2, 1),
    /** Screen pixels per unit movement in position */
    pixelsPerUnit: new Vector2(-2e2, 2e2),
    /** Screen pixels per degree rotation (right-handed about z) */
    pixelsPerDegree: -5,
    /** Scroll wheel pixels per unit scaling */
    pixelsPerScale: 5e2,
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
    setBorderWidth(state, { payload: borderWidth }: PayloadAction<number>) {
      state.borderWidth = borderWidth
    },
    translate({ spacemap }, { payload: { dx, dy } }: PayloadAction<{ dx: number; dy: number }>) {
      // Translate the spacemap the opposite direction but same magnitude as
      // your finger's movement, transformed through the portal. The feedback
      // should move with the finger.
      const ppu = spacemap.pixelsPerUnit
      spacemap.position.x += dx / ppu.x
      spacemap.position.y += dy / ppu.y
    },
    rotate({ spacemap }, { payload: distance }: PayloadAction<number>) {
      o.from(spacemap)
        .rotateZ(((distance / spacemap.pixelsPerDegree) * Math.PI) / 180.0)
        .to(spacemap)
    },
    zoom({ spacemap }, { payload: distance }: PayloadAction<number>) {
      const pps = spacemap.pixelsPerScale
      spacemap.scale.x += distance / pps
      spacemap.scale.y += distance / pps
    }
  }
})

export const {
  reducer,
  actions: { setBorderWidth, rotate, translate, zoom }
} = slice

/**
 * Returns a callback to access the current model state.
 *
 * This is imperative and used by the three.js render loop.
 */
export function useModelAccessor() {
  const store = useAppStore()
  return useCallback(() => store.getState().studio, [store])
}

type Selector<S, T> = (state: S) => T
type Bind<T> = (value: T) => void
type IsEqual<T> = (a: T, b: T) => boolean
const byReference: IsEqual<any> = (a, b) => a === b

/** Simple handlers for parts of the state tree */
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
