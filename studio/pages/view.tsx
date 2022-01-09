import { useRouter } from "next/router"
import { Viewer } from "../src/studio"

export default function Page() {
  const router = useRouter(),
    { u: authorUid, doc: docId } = router.query

  return (
    <Viewer
      authorUid={typeof authorUid === "string" ? authorUid : undefined}
      docId={typeof docId === "string" ? docId : undefined}
    />
  )
}
