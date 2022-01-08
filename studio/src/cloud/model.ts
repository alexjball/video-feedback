import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { useEffect } from "react"
import { auth } from "../firebase"
import { useAppDispatch } from "../hooks"
import { createService, declareThunk } from "../utils"

export interface State {
  uid: string | null
}

const initialState: State = {
  uid: null
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
      .addCase(thunks.publishDocument.rejected, (state, action) => {
        const rejection = action.payload as PublishRejection
        console.error("failed to publish", rejection)
      })
      .addCase(thunks.publishDocument.fulfilled, (state, action) => {
        console.log("successfully published", action.payload)
      })
})

export const {
  reducer,
  actions: { setUser }
} = slice

export const { Provider } = createService(() => {
  const dispatch = useAppDispatch()
  useEffect(() => auth.onAuthStateChanged(user => dispatch(setUser(user?.uid ?? null))), [dispatch])
})

export const thunks = {
  viewPublicDocument: declareThunk<void>("cloud/viewPublicDocument"),
  /**
   * Publishes a document and returns the public url. Rejects with a
   * `PublishRejection` payload if anything goes wrong.
   */
  publishDocument: declareThunk<string>("cloud/publishDocument")
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
