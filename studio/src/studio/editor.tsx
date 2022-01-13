import { faBusinessTime } from "@fortawesome/free-solid-svg-icons"
import { isRejected } from "@reduxjs/toolkit"
import { useRouter } from "next/router"
import { useEffect, useRef } from "react"
import db from "../db"
import { useAppDispatch, useAppSelector } from "../hooks"
import { openDocument } from "../io/actions"
import * as simFeat from "../simulation"
import { isDefined } from "../utils"
import { Controls, EditMenu, Info, Io, Simulation, StudioContainer, useStudio } from "./studio"

export function Editor({ docId }: { docId?: string }) {
  const dispatch = useAppDispatch(),
    router = useRouter(),
    ref = useRef(null),
    { io, modeLoaded } = useStudio("edit", ref),
    currentDocId = useAppSelector(s => s.io.document?.id),
    loaded = Boolean(modeLoaded && docId && currentDocId === docId)

  useEffect(
    () =>
      void (async () => {
        if (docId && isDefined(io)) {
          await dispatch(simFeat.model.fitToScreen())
          const result = await dispatch(
            openDocument({ io, id: docId, create: docId === "default" })
          )
          if (isRejected(result) && confirm("Couldn't open document. Reset?")) {
            await db.documents.delete(docId)
            await db.documents.create(docId)
            router.reload()
          }
        }
      })(),
    [currentDocId, dispatch, docId, io, router]
  )

  return (
    <StudioContainer containerRef={ref} loaded={loaded}>
      <Controls />
      <Io />
      <EditMenu />
      <Info />
      <Simulation />
    </StudioContainer>
  )
}
