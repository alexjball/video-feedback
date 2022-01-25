import { isRejected } from "@reduxjs/toolkit"
import { useRouter } from "next/router"
import { useEffect } from "react"
import db from "../db"
import { useAppDispatch } from "../hooks"
import { openDocument } from "../io/actions"
import * as simFeat from "../simulation"
import { isDefined } from "../utils"
import { Controls, EditMenu, Info, Io, Simulation, Studio, useStudio } from "./studio"

export function Editor({ docId }: { docId?: string }) {
  const dispatch = useAppDispatch(),
    router = useRouter(),
    studio = useStudio("edit"),
    { io, initialized, setLoaded } = studio

  useEffect(
    () =>
      void (async () => {
        if (docId && initialized && isDefined(io)) {
          await dispatch(simFeat.model.fitToScreen())
          const result = await dispatch(
            openDocument({ io, id: docId, create: docId === "default" })
          )
          if (isRejected(result) && confirm("Couldn't open document. Reset?")) {
            await db.documents.delete(docId)
            await db.documents.create(docId)
            router.reload()
          } else {
            setLoaded(true)
          }
        }
      })(),
    [dispatch, docId, initialized, io, router, setLoaded]
  )

  return (
    <Studio studio={studio}>
      <Controls />
      <Io />
      <EditMenu />
      <Info />
      <Simulation />
    </Studio>
  )
}
