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

import * as model from "../simulation/model"
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { nanoid } from "nanoid"

export interface State {
  playlist: Keyframe[]
  selection: {
    id: string
    modified: boolean
  } | null
  recording: boolean
}

export interface Keyframe {
  state: model.State
  id: string
  name: string
  thumbnail: string
}

const initialState: State = { playlist: [], selection: null, recording: false }

const slice = createSlice({
  name: "io",
  initialState,
  reducers: {
    addToPlaylist(state, { payload }: PayloadAction<{ state: model.State; thumbnail: string }>) {
      state.playlist.push({
        state: payload.state,
        name: availableName(state.playlist),
        id: nanoid(),
        thumbnail: payload.thumbnail
      })
    },
    moveKeyframe(
      { playlist },
      { payload: { id, index } }: PayloadAction<{ id: string; index: number }>
    ) {
      const currentIndex = playlist.findIndex(k => k.id === id)
      if (currentIndex !== -1 && currentIndex !== index) {
        const [k] = playlist.splice(currentIndex, 1)
        playlist.splice(index, 0, k)
      }
    }
  }
})

export const {
  reducer,
  actions: { addToPlaylist, moveKeyframe }
} = slice

let nextI = 1
function availableName(playlist: Keyframe[]) {
  while (playlist.find(k => k.name === String(nextI))) nextI++
  return String(nextI)
}
