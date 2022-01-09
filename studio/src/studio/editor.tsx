import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "../hooks"
import { openDocument } from "../io/actions"
import { isDefined } from "../utils"
import { setMode } from "./model"
import { Controls, EditMenu, Info, Io, Layout, Loading, Simulation } from "./studio"

export function Editor({ docId }: { docId?: string }) {
  const dispatch = useAppDispatch(),
    currentDocId = useAppSelector(s => s.io.document?.id),
    mode = useAppSelector(s => s.studio.mode),
    loaded = mode === "edit" && docId && currentDocId === docId

  useEffect(() => void dispatch(setMode("edit")), [dispatch])
  useEffect(() => {
    if (docId && !isDefined(currentDocId)) {
      dispatch(openDocument({ id: docId, create: docId === "default" }))
    }
  }, [currentDocId, dispatch, docId])

  return (
    <Layout>
      {loaded ? (
        <>
          <Controls />
          <Io />
          <EditMenu />
          <Info />
          <Simulation />
        </>
      ) : (
        <Loading />
      )}
    </Layout>
  )
}
