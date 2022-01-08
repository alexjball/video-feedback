import { isEqual } from "lodash"
import { nanoid } from "nanoid"
import { useEffect } from "react"
import db, { documents } from "../db"
import { useAppDispatch, useAppSelector, useAppStore } from "../hooks"
import * as simulation from "../simulation"
import { updateStateId } from "./model"

export default function useIo() {
  useApplySelection()
  useStateId()
  usePushUpdatesToDatabase()
}

function useApplySelection() {
  const dispatch = useAppDispatch(),
    { getState } = useAppStore(),
    selection = useAppSelector(s => s.io.selection.keyframeId)
  useEffect(() => {
    if (selection) {
      dispatch(
        simulation.model.restore(getState().io.keyframes.find(k => k.id === selection)!.state)
      )
    }
  }, [dispatch, getState, selection])
}

function useStateId() {
  const dispatch = useAppDispatch()
  const modifiers = useAppSelector(
    ({
      simulation: {
        feedback: { resolution: _1, nFrames: _2, ...feedback },
        drag: _3,
        viewport: _4,
        ...modifiers
      }
    }) => ({
      feedback,
      ...modifiers
    }),
    isEqual
  )
  useEffect(() => void dispatch(updateStateId(nanoid())), [modifiers, dispatch])
}

function usePushUpdatesToDatabase() {
  const document: documents.DbDocument | undefined = useAppSelector(
    s =>
      s.io.document && {
        id: s.io.document.id,
        title: s.io.document.title,
        keyframes: s.io.keyframes.map(k => k.id)
      },
    isEqual
  )
  useEffect(
    () =>
      void (async () => {
        try {
          if (document) {
            await db.documents.update(document)
          }
        } catch (e) {
          console.error("error updating document", e)
        }
      })(),
    [document]
  )
}
