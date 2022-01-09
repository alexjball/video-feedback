import { useEffect } from "react"
import { Io, Layout, Loading, Simulation, ViewMenu } from "./studio"
import { useAppDispatch, useAppSelector } from "../hooks"
import { bootstrap } from "../ui"
import { setMode } from "./model"
import { viewPublicDocument } from "../cloud"

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
    currentDocId = useAppSelector(s => s.io.document?.id),
    mode = useAppSelector(s => s.studio.mode),
    loaded = mode === "view" && docId && currentDocId === docId

  useEffect(() => void dispatch(setMode("view")), [dispatch])
  useEffect(
    () => void (authorUid && docId && dispatch(viewPublicDocument({ authorUid, docId }))),
    [authorUid, dispatch, docId]
  )

  return (
    <Layout>
      {loaded ? (
        <>
          <Io />
          <ViewMenu />
          <Simulation />
        </>
      ) : (
        <Loading />
      )}
    </Layout>
  )
}
