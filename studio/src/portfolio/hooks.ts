import { useLiveQuery } from "dexie-react-hooks"
import { useEffect, useMemo } from "react"
import db from "../db"
import { useAppDispatch, useAppSelector } from "../hooks"
import * as io from "../io"
import { setDocuments } from "./model"

export function usePortfolio() {
  const docs = useDocumentList(),
    portfolio = useMemo(() => ({ docs }), [docs])
  return portfolio
}

function useDocumentList() {
  const dispatch = useAppDispatch(),
    docIds = useLiveQuery(() => db.documents.list()),
    docs = useAppSelector(s => s.portfolio.documents),
    service = io.useService()
  useEffect(
    () =>
      void (async () => {
        if (!service || !docIds) return

        const docs = []
        for (const id of docIds) {
          const doc = await db.documents
            .get(id)
            .catch(() => console.log("failed to read document", id))
          if (doc && doc.keyframes.length > 0) docs.push(service.convertDocument(doc))
        }
        dispatch(setDocuments(docs))
      })(),
    [dispatch, docIds, service]
  )
  return docs
}
