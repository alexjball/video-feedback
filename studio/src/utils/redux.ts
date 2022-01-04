import { createAction } from "@reduxjs/toolkit"
import {
  AsyncThunkPendingActionCreator,
  AsyncThunkRejectedActionCreator,
  AsyncThunkFulfilledActionCreator
} from "@reduxjs/toolkit/dist/createAsyncThunk"

export type AsyncThunkActions<Returned, ThunkArg = void, ThunkApiConfig = {}> = {
  pending: AsyncThunkPendingActionCreator<ThunkArg, ThunkApiConfig>
  rejected: AsyncThunkRejectedActionCreator<ThunkArg, ThunkApiConfig>
  fulfilled: AsyncThunkFulfilledActionCreator<Returned, ThunkArg, ThunkApiConfig>
  typePrefix: string
}

/**
 * Create dummy action creators suitable for matching async thunks.
 * These allow the model to define async thunk types.
 * The actions will throw if dispatched.
 */
export function declareThunk<Returned = undefined, ThunkArg = void>(
  typePrefix: string
): AsyncThunkActions<Returned, ThunkArg> {
  return {
    pending: createActionMatcher(typePrefix, "pending"),
    fulfilled: createActionMatcher(typePrefix, "fulfilled"),
    rejected: createActionMatcher(typePrefix, "rejected"),
    typePrefix
  }
}

function createActionMatcher<T>(typePrefix: string, suffix: string): any {
  return createAction(typePrefix + "/" + suffix, () => {
    throw Error("Do not dispatch. Should only be used for matching.")
  })
}
