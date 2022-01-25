import { createSlice, PayloadAction } from "@reduxjs/toolkit"

export type Mode = "view" | "edit"
export interface State {
  mode: Mode
  acknowledgedEpilepsyWarning?: boolean
  supportedBrowser?: boolean
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
    },
    setAcknowledgedEpilepsyWarning(state, action: PayloadAction<boolean>) {
      state.acknowledgedEpilepsyWarning = action.payload
    },
    setSupportedBrowser(state, action: PayloadAction<boolean>) {
      state.supportedBrowser = action.payload
    }
  }
})

export const {
  reducer,
  actions: { setMode, setAcknowledgedEpilepsyWarning, setSupportedBrowser }
} = slice
