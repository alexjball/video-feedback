import { useEffect } from "react"
import { Io, Layout, Loading, Simulation, StudioContainer, useStudio, ViewMenu } from "./studio"
import { useAppDispatch, useAppSelector } from "../hooks"
import { setMode } from "./model"
import { viewPublicDocument } from "../cloud"
import * as ioFeature from "../io"
import * as simulationFeature from "../simulation"

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
    { modeLoaded, io } = useStudio("view"),
    currentDocId = useAppSelector(s => s.io.document?.id),
    loaded = Boolean(modeLoaded && docId && currentDocId === docId)

  useEffect(
    () =>
      void (async () => {
        if (authorUid && docId && io) {
          await dispatch(simulationFeature.model.fitToScreen())
          await dispatch(viewPublicDocument({ io, authorUid, docId }))
        }
      })(),
    [authorUid, dispatch, docId, io]
  )

  return (
    <StudioContainer loaded={loaded}>
      <Io />
      <ViewMenu />
      <Simulation />
    </StudioContainer>
  )
}
