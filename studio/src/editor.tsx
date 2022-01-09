import { useEffect } from "react"
import { useAppDispatch } from "./hooks"
import { openDocument } from "./io/actions"
import { Studio } from "./studio"

export function Editor({ docId }: { docId?: string }) {
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (docId) {
      dispatch(openDocument({ id: docId, create: docId === "default" }))
    }
  }, [dispatch, docId])

  return <Studio />
}
