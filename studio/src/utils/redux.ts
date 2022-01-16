import {
  createAction,
  isRejected,
  isRejectedWithValue,
  Middleware,
  MiddlewareAPI,
  SliceCaseReducers
} from "@reduxjs/toolkit"
import {
  AsyncThunkFulfilledActionCreator,
  AsyncThunkPendingActionCreator,
  AsyncThunkRejectedActionCreator
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

function createActionMatcher(typePrefix: string, suffix: string): any {
  return createAction(typePrefix + "/" + suffix, () => {
    throw Error("Do not dispatch. Should only be used for matching.")
  })
}

/**
 * Type-safe function to declare case reducers that can be merged into the
 * `reducers` of `createSlice`.
 *
 * This constrains `Reducers` to provide the proper typing for case functions.
 * It also infers the keys of the case object which are picked up by
 * `createSlice`.
 *
 * Typescript only supports all-or-nothing type inference, so we must also infer
 * the type of the slice state by passing `{} as State` as the first parameter.
 */
export const createCaseReducers = <State, Reducers extends SliceCaseReducers<State>>(
  _stateTypeHint: State,
  reducers: Reducers
) => reducers

/**
 * Log a warning for all rejected actions
 */
export const rejectionLogger: Middleware = (api: MiddlewareAPI) => next => action => {
  if (isRejectedWithValue(action) || isRejected(action)) {
    console.log("Async error!", action, action.error.stack)
  }
  return next(action)
}
