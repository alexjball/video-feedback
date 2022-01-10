import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "../hooks"
import { openDocument } from "../io/actions"
import * as simFeat from "../simulation"
import { isDefined } from "../utils"
import { Controls, EditMenu, Info, Io, Simulation, StudioContainer, useStudio } from "./studio"

export function Editor({ docId }: { docId?: string }) {
  const dispatch = useAppDispatch(),
    { io, modeLoaded } = useStudio("edit"),
    currentDocId = useAppSelector(s => s.io.document?.id),
    loaded = Boolean(modeLoaded && docId && currentDocId === docId)

  useEffect(
    () =>
      void (async () => {
        if (docId && isDefined(io)) {
          await dispatch(simFeat.model.fitToScreen())
          await dispatch(openDocument({ io, id: docId, create: docId === "default" }))
        }
      })(),
    [currentDocId, dispatch, docId, io]
  )

  return (
    <StudioContainer loaded={loaded}>
      <Controls />
      <Io />
      <EditMenu />
      <Info />
      <Simulation />
    </StudioContainer>
  )
}
