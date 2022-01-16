import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { useAppSelector } from "../hooks"
import { declareThunk } from "../utils"
import * as io from "../io"

export type Publication =
  | { status: "unknown" }
  | { status: "pending"; docId: string }
  | { status: "current" | "outdated"; url: string; docId: string }
  | { status: "error"; docId: string; reason: ErrorReason; code?: string }
export interface State {
  uid: string | null
  publications: Record<string, Publication>
}

const initialState: State = {
  uid: null,
  publications: {}
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
      .addCase(thunks.publishDocument.pending, (state, { meta: { arg: docId } }) => {
        state.publications[docId] = { status: "pending", docId }
      })
      .addCase(thunks.publishDocument.rejected, (state, action) => {
        const { docId, reason, code } = action.payload as PublishRejection
        state.publications[docId] = { status: "error", docId, reason, code }
      })
      .addCase(thunks.publishDocument.fulfilled, (state, { payload: { docId, publicUrl } }) => {
        state.publications[docId] = { status: "current", docId, url: publicUrl }
      })
      .addCase(io.model.closeDocument, (state, { payload: docId }) => {
        // Reset publication state in case it was edited
        state.publications[docId] = { status: "unknown" }
      })
})

export function usePublication(docId: string) {
  return useAppSelector(s => s.cloud.publications[docId] ?? { status: "unknown" })
}

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
  publishDocument: declareThunk<{ docId: string; publicUrl: string }, string>(
    "cloud/publishDocument"
  )
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
