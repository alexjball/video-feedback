import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { useEffect } from "react"
import { auth } from "../firebase"
import { useAppDispatch } from "../hooks"
import { createService } from "../utils"

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
  }
})

export const {
  reducer,
  actions: { setUser }
} = slice

export const { Provider } = createService(() => {
  const dispatch = useAppDispatch()
  useEffect(() => auth.onAuthStateChanged(user => dispatch(setUser(user?.uid ?? null))), [dispatch])
})

// To publish:
// First-time explainer
// Upload each thumbnail object
// Create or update studio document
const publish = createAsyncThunk("cloud/publish", async () => {})
