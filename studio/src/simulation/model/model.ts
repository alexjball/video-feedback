import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { immerable } from "immer"
import { Color, Quaternion, Vector2, Vector3, Vector4 } from "three"
import { Resolution, State } from "../types"
import { assign } from "./helpers"
import { caseReducers as interactionActions } from "./interactions"

export * from "../types"

/**
 * Mark classes as copyable by immer, which also make the middleware treat them
 * as serializable.
 */
function markImmerable() {
  const mark = (constructor: any) => (constructor[immerable] = true)
  void [Quaternion, Vector2, Vector3, Vector4].map(mark)
}
markImmerable()

const initialColors = {
  border: "#f5f5ff",
  background: "#1b1d36"
}
/**
 * The portal, viewer, and feedback geometries are 1x1 squares centered on the
 * origin. Therefore width and height are equal to scale!
 */
export const initialState: State = {
  version: 2,
  border: {
    width: 0.1,
    coords: {
      position: new Vector3(0, 0, -1),
      scale: new Vector3(1.2, 1.2, 1),
      quaternion: new Quaternion()
    },
    color: initialColors.border
  },
  background: {
    color: initialColors.background
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
    pixelsPerScale: 2e3
  },
  feedback: {
    nFrames: 1,
    colorCycle: 0.1,
    colorGain: 0.3,
    fsPeriod: 0.15,
    fsAmplitude: 0.2,
    fsPhase: 0,
    fsPop: 0.1,
    fsColor1: initialColors.background,
    fsColor2: initialColors.border,
    invertColor: false,
    seedOpacity: 0,
    resolution: {
      width: 0,
      height: 0
    }
  },
  portal: {
    coords: {
      position: new Vector3(0, 0, 0),
      scale: new Vector3(1, 1, 1),
      quaternion: new Quaternion()
    },
    nTiles: 1
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
  drag: { start: null },
  gesture: {},
  preventStrobing: true
}

const slice = createSlice({
  name: "simulation",
  initialState,
  reducers: {
    ...interactionActions,
    setPreventStrobing(state, { payload }: PayloadAction<boolean>) {
      state.preventStrobing = payload
    },
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
    setBorderWidth(
      { border, portal: { coords, nTiles } },
      { payload: borderWidth }: PayloadAction<number>
    ) {
      border.width = borderWidth
      border.coords.scale.set(
        nTiles * coords.scale.x + 2 * borderWidth,
        nTiles * coords.scale.y + 2 * borderWidth,
        1
      )
    },
    /**
     * width: width of feedback target, defaults to the current resolution
     * aspect: aspect of feedback target, determines height using width
     * height: height of feedback target, defaults to matching aspect given width
     */
    updatePortal(state, { payload }: PayloadAction<UpdatePortal>) {
      if (payload.nTiles) {
        state.portal.nTiles = payload.nTiles
      }

      const res = state.feedback.resolution,
        width = payload.width ?? res.width,
        aspect = payload.aspect ?? res.width / res.height,
        height = payload.height ?? width / aspect
      if (isNaN(height) || isNaN(width)) throw Error("Invalid portal resolution")
      resizePortal({ width, height }, state)
      setViewToContainPortal(state)
    },
    setViewer(
      state,
      { payload: { width, height } }: PayloadAction<{ width: number; height: number }>
    ) {
      state.viewport.width = width
      state.viewport.height = height

      setViewToContainPortal(state)
    },
    center(state) {
      state.portal.coords.position.copy(initialState.portal.coords.position)
      state.portal.coords.quaternion.copy(initialState.portal.coords.quaternion)
      state.border.coords.position.copy(initialState.border.coords.position)
      state.border.coords.quaternion.copy(initialState.border.coords.quaternion)
      state.viewer.coords.position.copy(initialState.viewer.coords.position)
      state.viewer.coords.quaternion.copy(initialState.viewer.coords.quaternion)
      state.spacemap.coords = initialState.spacemap.coords
    },
    setBackgroundColor(state, { payload: color }: PayloadAction<string>) {
      state.background.color = cleanColor(color)
    },
    setBorderColor(state, { payload: color }: PayloadAction<string>) {
      state.border.color = cleanColor(color)
    },
    setFeedbackOptions(state, { payload }: PayloadAction<Partial<State["feedback"]>>) {
      Object.assign(state.feedback, payload)
    },
    restore(state, { payload }: PayloadAction<State>) {
      assign(payload.portal, state.portal, ["coords", "nTiles"])
      assign(payload.border, state.border, ["color", "width", "coords"])
      assign(payload.background, state.background, ["color"])
      assign(payload.feedback, state.feedback, [
        "colorCycle",
        "colorGain",
        "invertColor",
        "fsAmplitude",
        "fsColor1",
        "fsColor2",
        "fsPeriod",
        "fsPhase",
        "fsPop"
      ])
      assign(payload.spacemap, state.spacemap, ["mirrorX", "mirrorY", "coords"])
      state.preventStrobing = payload.preventStrobing

      // Maintain the current width resolution but restore the exact aspect of
      // the saved state.
      const aspect = payload.feedback.resolution.width / payload.feedback.resolution.height,
        currentWidth = state.feedback.resolution.width
      resizePortal({ width: currentWidth, height: currentWidth / aspect }, state)
      setViewToContainPortal(state)
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
    restore,
    rotate,
    zoom,
    setViewer,
    updatePortal,
    updateGesture,
    drag,
    center,
    setPreventStrobing,
    setFeedbackOptions
  }
} = slice

slice.actions
function cleanColor(color: string): string {
  return `#${new Color(color).getHexString()}`
}

/** Returns a box of unit area with the specified aspect ratio. */
function unitAspect(aspect: number) {
  const width = Math.sqrt(aspect),
    height = 1 / width
  return new Vector3(width, height, 1)
}

/** Returns the smallest box with the given aspect ratio that is at least as
 * large as the requested dimensions.*/
function contain(width: number, height: number, aspect: number) {
  const contentAspect = width / height
  if (contentAspect > aspect) return { width, height: width / aspect }
  else return { height, width: aspect * height }
}

type UpdatePortal = {
  aspect?: number
  height?: number
  width?: number
  nTiles?: number
}

function resizePortal({ width, height }: Resolution, { feedback, portal, border }: State) {
  feedback.resolution.height = Math.round(height)
  feedback.resolution.width = Math.round(width)

  const scale = unitAspect(width / height),
    nTiles = portal.nTiles
  portal.coords.scale.copy(scale)

  border.coords.scale.set(
    nTiles * portal.coords.scale.x + 2 * border.width,
    nTiles * portal.coords.scale.y + 2 * border.width,
    1
  )
}

function setViewToContainPortal(state: State) {
  const viewAspect = state.viewport.width / state.viewport.height,
    scale = state.portal.coords.scale,
    container = contain(scale.x, scale.y, viewAspect)

  state.viewer.coords.scale.set(container.width, container.height, 1)
}

export const fitToScreen = createAsyncThunk("simulation/fitToScreen", (_: void, { dispatch }) => {
  dispatch(setViewer({ width: innerWidth, height: innerHeight }))
  dispatch(
    updatePortal({
      width: innerWidth * devicePixelRatio,
      height: innerHeight * devicePixelRatio
    })
  )
})
