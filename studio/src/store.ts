import { configureStore, isPlain } from "@reduxjs/toolkit"
import { isDraftable } from "immer"
import { reducer as cloud } from "./cloud"
import { reducer as io } from "./io"
import { reducer as portfolio } from "./portfolio"
import { reducer as simulation } from "./simulation"
import { reducer as stats } from "./stats"
import { reducer as studio } from "./studio"
import { rejectionLogger } from "./utils"

export const createStore = () =>
  configureStore({
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        /** Allow plain JSON and immerable objects */
        serializableCheck: {
          isSerializable: (value: any) =>
            isPlain(value) || isDraftable(value) || value instanceof Date
        } as any
      }).concat(rejectionLogger),
    reducer: {
      simulation,
      stats,
      io,
      cloud,
      studio,
      portfolio
    }
  })

export const store = createStore()

// https://redux-toolkit.js.org/tutorials/typescript
//
// Import these with `import type ...` to ensure that the store dependency is erased.
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
