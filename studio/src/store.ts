import { configureStore, isPlain } from "@reduxjs/toolkit"
import { isDraftable } from "immer"
import { reducer as simulation } from "./simulation"
import { reducer as stats } from "./stats"

export const createStore = () =>
  configureStore({
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        /** Allow plain JSON and immerable objects */
        serializableCheck: {
          isSerializable: (value: any) => isPlain(value) || isDraftable(value)
        } as any
      }),
    reducer: {
      simulation,
      stats
    }
  })

export const store = createStore()

// https://redux-toolkit.js.org/tutorials/typescript
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
