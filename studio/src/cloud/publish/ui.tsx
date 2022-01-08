import { faShare } from "@fortawesome/free-solid-svg-icons"
import { common, bootstrap } from "../../ui"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { useCallback } from "react"
import { publishDocument } from "./action"

const { OverlayTrigger, Tooltip } = bootstrap

export function Publish() {
  const authenticated = useAppSelector(s => !!s.cloud.uid),
    docId = useAppSelector(s => s.io.document?.id),
    docOpen = !!docId,
    dispatch = useAppDispatch(),
    publish = useCallback(() => dispatch(publishDocument(docId!)), [dispatch, docId])
  return (
    <OverlayTrigger
      show={authenticated ? false : undefined}
      placement="bottom"
      overlay={<Tooltip>Sign in to publish</Tooltip>}>
      <div style={{ pointerEvents: "all" }}>
        <common.IconButton onClick={publish} icon={faShare} disabled={!authenticated || !docOpen}>
          Publish
        </common.IconButton>
      </div>
    </OverlayTrigger>
  )
}
