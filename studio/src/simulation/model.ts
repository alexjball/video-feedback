import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { immerable } from "immer"
import { Color, Matrix4, Object3D, Quaternion, Vector2, Vector3, Vector4 } from "three"

const pi2 = 2 * Math.PI

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
  border: {
    width: number
    coords: Coords
    color: string
  }
  background: {
    color: string
  }
  spacemap: {
    coords: Coords
    pixelsPerScale: number
    mirrorX: boolean
    mirrorY: boolean
  }
  feedback: {
    nFrames: number
    invertColor: boolean
    colorCycle: number
    colorGain: number
  }
  portal: {
    coords: Coords
    // geometry: Rect
  }
  viewer: {
    coords: Coords
    // geometry: Rect
  }
  viewport: {
    width: number
    height: number
  }
  drag: {
    start: {
      coords: Coords
      x: number
      y: number
    } | null
  }
}

/** Axis-aligned 2-d rectangle! */
export interface Rect {
  min: Vector2
  max: Vector2
}

export interface Coords {
  position: Vector3
  quaternion: Quaternion
  scale: Vector3
}

/**
 * The portal, viewer, and feedback geometries are 1x1 squares centered on the
 * origin. Therefore width and height are equal to scale!
 */
const initialState: State = {
  border: {
    width: 0.1,
    coords: {
      position: new Vector3(0, 0, -1),
      scale: new Vector3(1.2, 1.2, 1),
      quaternion: new Quaternion()
    },
    color: "#f5f5ff"
  },
  background: {
    color: "#4d518f"
  },
  spacemap: {
    coords: {
      position: new Vector3(0.3, 0.1, 0),
      scale: new Vector3(2, 2, 1),
      quaternion: new Quaternion()
    },
    mirrorX: true,
    mirrorY: false,
    /** Scroll wheel pixels per unit scaling */
    pixelsPerScale: 5e2
  },
  feedback: {
    nFrames: 5,
    colorCycle: 0.3,
    colorGain: 0.3,
    invertColor: false
  },
  portal: {
    coords: {
      position: new Vector3(0, 0, 0),
      scale: new Vector3(1, 1, 1),
      quaternion: new Quaternion()
    }
  },
  viewer: {
    coords: {
      position: new Vector3(0, 0, 10),
      scale: new Vector3(1, 1, 1),
      quaternion: new Quaternion()
    }
  },
  viewport: {
    width: 0,
    height: 0
  },
  drag: { start: null }
}

export function createCoords(): Coords {
  return { position: new Vector3(), scale: new Vector3(), quaternion: new Quaternion() }
}
export function copyCoords(from: Coords, to: Coords = createCoords()): Coords {
  to.position.copy(from.position)
  to.quaternion.copy(from.quaternion)
  to.scale.copy(from.scale)
  return to
}

class Object3DCoords extends Object3D {
  from(coords: Coords) {
    copyCoords(coords, this)
    this.updateMatrixWorld()
    return this
  }

  to(coords: Coords) {
    copyCoords(this, coords)
  }
}

const o = new Object3DCoords()
const m = new Matrix4()

const slice = createSlice({
  name: "simulation",
  initialState,
  reducers: {
    setMirrorX({ spacemap }, { payload: mirrorX }: PayloadAction<boolean>) {
      spacemap.mirrorX = mirrorX
    },
    setMirrorY({ spacemap }, { payload: mirrorY }: PayloadAction<boolean>) {
      spacemap.mirrorY = mirrorY
    },
    setNumberFeedbackFrames({ feedback }, { payload: nFrames }: PayloadAction<number>) {
      feedback.nFrames = nFrames
    },
    setColorCycle({ feedback }, { payload }: PayloadAction<number>) {
      feedback.colorCycle = payload
    },
    setColorGain({ feedback }, { payload }: PayloadAction<number>) {
      feedback.colorGain = payload
    },
    setInvertColor({ feedback }, { payload }: PayloadAction<boolean>) {
      feedback.invertColor = payload
    },
    setBorderWidth({ border, portal }, { payload: borderWidth }: PayloadAction<number>) {
      border.width = borderWidth
      border.coords.scale.set(
        portal.coords.scale.x + 2 * borderWidth,
        portal.coords.scale.y + 2 * borderWidth,
        1
      )
    },
    drag(
      { spacemap: { coords: spacemap }, viewport, viewer, drag },
      {
        payload: { x, y, end = false, start = false }
      }: PayloadAction<{ x: number; y: number; end?: boolean; start?: boolean }>
    ) {
      if (start || !drag.start) {
        drag.start = {
          coords: copyCoords(spacemap),
          x,
          y
        }
      }

      const dx = x - drag.start.x,
        dy = y - drag.start.y,
        dragStart = drag.start.coords

      const v = new Vector3(dx / viewport.width, -dy / viewport.height)
      o.from(viewer.coords).localToWorld(v)

      const s = o.from(dragStart)
      s.position.set(0, 0, 0)
      s.updateMatrixWorld()
      s.localToWorld(v)

      spacemap.position.x = dragStart.position.x - v.x
      spacemap.position.y = dragStart.position.y - v.y

      if (end) {
        drag.start = null
      }
    },
    rotate(
      { spacemap: { coords: spacemap }, viewport },
      { payload: { dx, dy } }: PayloadAction<{ dx: number; dy: number }>
    ) {
      const feedbackAngle = (dy / viewport.height) * pi2,
        portalAngle = (dx / viewport.width) * pi2
      o.from(spacemap)
        .rotateZ(portalAngle + feedbackAngle)
        .to(spacemap)
      spacemap.position.applyMatrix4(m.makeRotationZ(portalAngle))
    },
    zoom({ spacemap }, { payload: distance }: PayloadAction<number>) {
      const pps = spacemap.pixelsPerScale
      spacemap.coords.scale.x += distance / pps
      spacemap.coords.scale.y += distance / pps
    },
    setSize(
      { viewport, portal, viewer, border },
      { payload: { width, height } }: PayloadAction<{ width: number; height: number }>
    ) {
      const aspect = width / height,
        unitWidth = Math.sqrt(aspect),
        unitHeight = 1 / unitWidth

      viewport.width = width
      viewport.height = height
      portal.coords.scale.set(unitWidth, unitHeight, 1)
      border.coords.scale.set(unitWidth + 2 * border.width, unitHeight + 2 * border.width, 1)
      viewer.coords.scale.copy(portal.coords.scale)
    },
    center(state) {
      state.portal.coords.position.copy(initialState.portal.coords.position)
      state.portal.coords.quaternion.copy(initialState.portal.coords.quaternion)
      state.border.coords.position.copy(initialState.border.coords.position)
      state.border.coords.quaternion.copy(initialState.border.coords.quaternion)
      state.viewer.coords.position.copy(initialState.viewer.coords.position)
      state.viewer.coords.quaternion.copy(initialState.viewer.coords.quaternion)
      state.spacemap = initialState.spacemap
    },
    setBackgroundColor(state, { payload: color }: PayloadAction<string>) {
      state.background.color = cleanColor(color)
    },
    setBorderColor(state, { payload: color }: PayloadAction<string>) {
      state.border.color = cleanColor(color)
    }
  }
})

export const {
  reducer,
  actions: {
    setMirrorX,
    setMirrorY,
    setNumberFeedbackFrames,
    setColorCycle,
    setColorGain,
    setInvertColor,
    setBorderWidth,
    setBackgroundColor,
    setBorderColor,
    rotate,
    zoom,
    setSize,
    drag,
    center
  }
} = slice

function cleanColor(color: string): string {
  return `#${new Color(color).getHexString()}`
}
