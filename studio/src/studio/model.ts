import { createSlice, PayloadAction } from "@reduxjs/toolkit"

export type Mode = "view" | "edit"
export interface State {
  mode: Mode
}

const initialState: State = {
  mode: "edit"
}

const slice = createSlice({
  name: "studio",
  initialState,
  reducers: {
    setMode(state, { payload: mode }: PayloadAction<Mode>) {
      state.mode = mode
    }
  }
})

export const {
  reducer,
  actions: { setMode }
} = slice
