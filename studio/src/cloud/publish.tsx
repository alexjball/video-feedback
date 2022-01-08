import { faShare } from "@fortawesome/free-solid-svg-icons"
import { common, bootstrap } from "../ui"
import { useAppSelector } from "../hooks"

const { OverlayTrigger, Tooltip } = bootstrap

export function Publish() {
  const authenticated = useAppSelector(s => !!s.cloud.uid)

  return (
    <OverlayTrigger
      show={authenticated ? false : undefined}
      placement="bottom"
      overlay={<Tooltip>Sign in to publish</Tooltip>}>
      <div style={{ pointerEvents: "all" }}>
        <common.IconButton icon={faShare} disabled={!authenticated}>
          Publish
        </common.IconButton>
      </div>
    </OverlayTrigger>
  )
}
