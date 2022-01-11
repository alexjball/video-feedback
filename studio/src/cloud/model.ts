import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { declareThunk } from "../utils"

export interface State {
  uid: string | null
  publish:
    | { status: "unknown" | "pending" }
    | { status: "current" | "outdated"; url: string; docId: string }
    | { status: "error"; docId: string; reason: ErrorReason; code?: string }
}

const initialState: State = {
  uid: null,
  publish: { status: "unknown" }
}

const slice = createSlice({
  name: "cloud",
  initialState,
  reducers: {
    setUser(state, { payload: uid }: PayloadAction<string | null>) {
      state.uid = uid
    }
  },
  extraReducers: builder =>
    builder
      .addCase(thunks.publishDocument.pending, (state, action) => {
        state.publish = { status: "pending" }
      })
      .addCase(thunks.publishDocument.rejected, (state, action) => {
        const { docId, reason, code } = action.payload as PublishRejection
        state.publish = { status: "error", docId, reason, code }
      })
      .addCase(thunks.publishDocument.fulfilled, (state, { payload: { docId, publicUrl } }) => {
        state.publish = { status: "current", docId, url: publicUrl }
      })
})

export const {
  reducer,
  actions: { setUser }
} = slice

export const thunks = {
  viewPublicDocument: declareThunk<void>("cloud/viewPublicDocument"),
  /**
   * Publishes a document and returns the public url. Rejects with a
   * `PublishRejection` payload if anything goes wrong.
   */
  publishDocument: declareThunk<{ docId: string; publicUrl: string }>("cloud/publishDocument")
}

export type ErrorReason =
  | "unsaved-changes"
  | "unauthenticated"
  | "thumbnail-upload-failure"
  | "document-upload-failure"
  | "cloud-validation-error"

export type PublishRejection = {
  docId: string
  reason: ErrorReason
  code?: string
}
