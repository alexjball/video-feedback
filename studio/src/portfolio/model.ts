import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import db from "../db"
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
  actions: { setDocuments, setSelected, setTitle }
} = createSlice({
  name: "portfolio",
  initialState,
  reducers: {
    setDocuments(state, { payload: docs }: PayloadAction<io.model.Document[]>) {
      state.documents = docs
    },
    setSelected(state, { payload: id }: PayloadAction<string>) {
      state.selected = id
    },
    setTitle(state, { payload: { id, title } }: PayloadAction<{ id: string; title: string }>) {
      const d = state.documents?.find(d => d.id === id)
      if (d) {
        d.name = title
      }
    }
  }
})

export const updateTitle = createAsyncThunk(
  "portfolio/updateTitle",
  async ({ id, title }: { id: string; title: string }) => {
    await db.documents.update({ id, name: title })
  }
)
