import { useRouter } from "next/router"
import { Editor } from "../src/studio"

export default function Page() {
  const router = useRouter(),
    { doc: docId } = router.query

  return <Editor docId={typeof docId === "string" ? docId : undefined} />
}
