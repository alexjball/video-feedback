import { useRouter } from "next/router"
import { Editor } from "../../src"

export default function Page() {
  const router = useRouter(),
    { docId } = router.query

  return <Editor docId={typeof docId === "string" ? docId : undefined} />
}
