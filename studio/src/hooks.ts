import { AsyncThunkOptions, AsyncThunkPayloadCreator, createAsyncThunk } from "@reduxjs/toolkit"
import { TypedUseSelectorHook, useDispatch, useSelector, useStore } from "react-redux"
import type { RootState, AppDispatch, AppStore } from "./store"
import { AsyncThunkActions } from "./utils"

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
export const useAppStore: () => AppStore = () => useStore()

type ThunkConfig = {
  state: RootState
  dispatch: AppDispatch
}

export const createAppThunk = <Returned, ThunkArg = void>(
  asyncActions: AsyncThunkActions<Returned>,
  payloadCreator: AsyncThunkPayloadCreator<Returned, ThunkArg, ThunkConfig>,
  options?: AsyncThunkOptions<ThunkArg, ThunkConfig>
) =>
  createAsyncThunk<Returned, ThunkArg, ThunkConfig>(
    asyncActions.typePrefix,
    payloadCreator,
    options
  )
