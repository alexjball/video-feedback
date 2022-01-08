import { useEffect } from "react"
import { useAppDispatch } from "./hooks"
import { openDocument } from "./io/actions"
import { Studio } from "./studio"

export function Editor({ docId }: { docId?: string }) {
  const dispatch = useAppDispatch(),
    defaultDocument = !docId
  useEffect(() => {
    if (docId) {
      dispatch(openDocument({ id: docId, create: docId === "default" }))
    }
  }, [defaultDocument, dispatch, docId])

  return <Studio />
}
