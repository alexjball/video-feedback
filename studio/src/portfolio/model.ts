import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import * as io from "../io"

interface State {
  documents: io.model.Document[] | null
  selected: string | null
}

const initialState: State = {
  documents: null,
  selected: null
}

export const {
  reducer,
  actions: { setDocuments, setSelected }
} = createSlice({
  name: "portfolio",
  initialState,
  reducers: {
    setDocuments(state, { payload: docs }: PayloadAction<io.model.Document[]>) {
      state.documents = docs
    },
    setSelected(state, { payload: id }: PayloadAction<string>) {
      state.selected = id === state.selected ? null : id
    }
  }
})
