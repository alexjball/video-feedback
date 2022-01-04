/**
 * Pane to control playback, recording, and saving, and loading.
 *
 * Maybe a timeline view?
 *
 * Save feedback configurations and small screenshots
 *
 * Make control view more of a parameter monitor. Allow user to freely map
 * parameters to interactions. Monitor hides by default, and the user can pin
 * parameter UI. Parameter UI appears during controlling interactions.
 *
 * Build saving and timeline in io, state monitor in control, and interaction configuration in navigation
 */
// https://github.com/atlassian/react-beautiful-dnd/blob/master/stories/src/horizontal/author-app.jsx
// https://github.com/atlassian/react-beautiful-dnd/blob/master/stories/src/primatives/author-list.jsx

import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import * as model from "../simulation/model"
import { declareThunk, isDefined } from "../utils"

export interface State {
  keyframes: Keyframe[]
  title?: string
  selection: Selection
}

export interface Selection {
  /** Selected keyframe */
  keyframeId?: string
  /** Identifies the simulation state */
  stateId?: string
  modified: boolean
}

export function newSelection(keyframeId?: string): Selection {
  return { keyframeId, modified: false }
}

export interface Keyframe {
  state: model.State
  id: string
  name?: string
  // Created via URL.createObjectURL
  thumbnail: string
}

const initialState: State = {
  keyframes: [],
  selection: { modified: false }
}

const slice = createSlice({
  name: "io",
  initialState,
  reducers: {
    selectKeyframe(state, { payload: keyframeId }: PayloadAction<string>) {
      state.selection.keyframeId = keyframeId
      state.selection.stateId = undefined
    },
    updateStateId(state, { payload: stateId }: PayloadAction<string>) {
      if (!state.selection.stateId) {
        state.selection.stateId = stateId
        state.selection.modified = false
      } else {
        state.selection.modified = stateId !== state.selection.stateId
      }
    },
    moveKeyframe(
      { keyframes },
      { payload: { id, index } }: PayloadAction<{ id: string; index: number }>
    ) {
      const currentIndex = keyframes.findIndex(k => k.id === id)
      if (currentIndex !== -1 && currentIndex !== index) {
        const [k] = keyframes.splice(currentIndex, 1)
        keyframes.splice(index, 0, k)
      }
    }
  },
  extraReducers: builder =>
    builder
      .addCase(thunks.addKeyframe.fulfilled, (state, { payload: keyframe }) => {
        let index: number
        const selection = state.selection.keyframeId
        if (isDefined(selection)) {
          index = state.keyframes.findIndex(k => k.id === selection) + 1
        } else {
          index = state.keyframes.length
        }

        state.keyframes.splice(index, 0, keyframe)
        state.selection = newSelection(keyframe.id)
      })
      .addCase(thunks.snapshotKeyframe.fulfilled, (state, { payload: update }) => {
        const frame = state.keyframes.find(k => k.id === update.id)
        if (frame) {
          frame.state = update.state
          frame.thumbnail = update.thumbnail
        }
        state.selection = newSelection(update.id)
      })
      .addCase(thunks.deleteKeyframe.fulfilled, (state, { payload: id }) => {
        const index = state.keyframes.findIndex(k => k.id === id)
        if (index === -1) return

        state.keyframes.splice(index, 1)
        if (state.selection?.keyframeId === id) {
          if (state.keyframes.length > 0) {
            const newSelectionIndex = Math.min(Math.max(index - 1, 0), state.keyframes.length)
            state.selection = newSelection(state.keyframes[newSelectionIndex].id)
          } else {
            state.selection = newSelection()
          }
        }
      })
      .addCase(thunks.undoKeyframe.fulfilled, (state, { payload: id }) => {
        state.selection = newSelection(id)
      })
})

export const {
  reducer,
  actions: { moveKeyframe, selectKeyframe, updateStateId }
} = slice

export const thunks = {
  addKeyframe: declareThunk<Keyframe>("io/addKeyframe"),
  deleteKeyframe: declareThunk<string>("io/deleteKeyframe"),
  undoKeyframe: declareThunk<string>("io/undoKeyframe"),
  snapshotKeyframe:
    declareThunk<Pick<Keyframe, "id" | "thumbnail" | "state">>("io/snapshotKeyframe")
}
