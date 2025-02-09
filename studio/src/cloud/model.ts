import { Timestamp } from "@firebase/firestore"
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { JsonDocument } from "../db/documents"
import { JsonKeyframe } from "../db/keyframes"
import { useAppSelector } from "../hooks"
import * as io from "../io"
import { declareThunk, Modify } from "../utils"

export type CloudTimes = { createdAt?: Timestamp; updatedAt?: Timestamp }
export type CloudKeyframe = Modify<JsonKeyframe, CloudTimes>
export type CloudDocument = Modify<JsonDocument, CloudTimes & { keyframes: CloudKeyframe[] }>

export type Publication =
  | { status: "unknown" }
  | { status: "pending"; docId: string }
  | { status: "current" | "outdated"; url: string; docId: string }
  | { status: "error"; docId: string; reason: ErrorReason; code?: string }
export interface State {
  uid: string | null
  publications: Record<string, Publication>
  isLocalUpToDate: boolean
  isInitiallySynced: boolean
}

const initialState: State = {
  uid: null,
  publications: {},
  isLocalUpToDate: false,
  isInitiallySynced: false
}

const slice = createSlice({
  name: "cloud",
  initialState,
  reducers: {
    setUser(state, { payload: uid }: PayloadAction<string | null>) {
      state.uid = uid
    },
    localUpToDate(state) {
      state.isLocalUpToDate = true
    },
    initiallySynced(state) {
      state.isInitiallySynced = true
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
      .addCase(thunks.performInitialSyncToCloud.fulfilled, state => {
        state.isInitiallySynced = true
      })
      .addCase(thunks.performInitialSyncToCloud.rejected, state => {
        console.error("Failed to perform initial sync to cloud")
        state.isInitiallySynced = true
      })
})

export function usePublication(docId: string) {
  return useAppSelector(s => s.cloud.publications[docId] ?? { status: "unknown" })
}

export function useSyncInfo() {
  return useAppSelector(s => ({
    uid: s.cloud.uid,
    isLocalUpToDate: s.cloud.isLocalUpToDate,
    isInitiallySynced: s.cloud.isInitiallySynced
  }))
}

export function useUid() {
  return useAppSelector(s => s.cloud.uid)
}

export const {
  reducer,
  actions: { setUser, localUpToDate, initiallySynced }
} = slice

export const thunks = {
  viewPublicDocument: declareThunk<void>("cloud/viewPublicDocument"),
  /**
   * Publishes a document and returns the public url. Rejects with a
   * `PublishRejection` payload if anything goes wrong.
   */
  publishDocument: declareThunk<{ docId: string; publicUrl: string }, string>(
    "cloud/publishDocument"
  ),
  unpublishDocument: declareThunk<void, string>("cloud/unpublishDocument"),
  performInitialSyncToCloud: declareThunk<void, void>("cloud/performInitialSyncToCloud")
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
