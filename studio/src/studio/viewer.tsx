import { isRejected } from "@reduxjs/toolkit"
import { useEffect } from "react"
import { viewPublicDocument } from "../cloud"
import { useAppDispatch } from "../hooks"
import * as simulationFeature from "../simulation"
import { Io, Simulation, Studio, useStudio, ViewMenu } from "./studio"

// TODO: clear db on auth failure or change. store current user in db and
// compare with auth
// TODO: easy user preferences / user data
// TODO: figure out how to sync to firestore in background, and how to handle
// conflicts.

/**
 * The viewer is for "consuming content", it has simplified controls and loads
 * published patterns (no reason it couldn't do private ones)
 *
 * The user can play back patterns and interact with the geometry. No state is
 * saved, and the control and stats panels are hidden.
 *
 * The user can clone and edit published documents. After the new document is
 * created, the page redirects to /edit
 */
export function Viewer({ authorUid, docId }: { authorUid?: string; docId?: string }) {
  const dispatch = useAppDispatch(),
    studio = useStudio("view"),
    { initialized, setLoaded, io } = studio

  useEffect(
    () =>
      void (async () => {
        if (initialized && authorUid && docId && io) {
          await dispatch(simulationFeature.model.fitToScreen())
          const result = await dispatch(viewPublicDocument({ io, authorUid, docId }))
          if (isRejected(result)) {
            alert("Couldn't load document")
          } else {
            setLoaded(true)
          }
        }
      })(),
    [authorUid, dispatch, docId, initialized, io, setLoaded]
  )

  return (
    <Studio studio={studio}>
      <Io />
      <ViewMenu />
      <Simulation />
    </Studio>
  )
}
