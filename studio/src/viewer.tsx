import { useEffect } from "react"
import { Studio } from "./studio"
import { view } from "./cloud"
import { useAppDispatch } from "./hooks"

export function Viewer({ authorUid, docId }: { authorUid?: string; docId?: string }) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (authorUid && docId) {
      dispatch(view.viewPublicDocument({ authorUid, docId }))
    }
  }, [authorUid, dispatch, docId])

  return <Studio />
}
