import { useRouter } from "next/router"
import { Viewer } from "../../../src"

export default function Page() {
  const router = useRouter(),
    { authorUid, docId } = router.query

  return (
    <Viewer
      authorUid={typeof authorUid === "string" ? authorUid : undefined}
      docId={typeof docId === "string" ? docId : undefined}
    />
  )
}
