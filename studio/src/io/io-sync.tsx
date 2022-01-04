import { useEffect } from "react"
import { useAppDispatch, useAppSelector, useAppStore } from "../hooks"
import * as simulation from "../simulation"

export default function useIoSync() {
  useSelectionSync()
}

function useSelectionSync() {
  const dispatch = useAppDispatch(),
    { getState } = useAppStore(),
    selection = useAppSelector(s => s.io.selection)
  useEffect(() => {
    if (selection) {
      dispatch(
        simulation.model.restore(getState().io.keyframes.find(k => k.id === selection.id)!.state)
      )
    }
  }, [dispatch, getState, selection])
}
