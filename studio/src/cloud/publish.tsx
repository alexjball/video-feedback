import { faShare, faCopy } from "@fortawesome/free-solid-svg-icons"
import { common, bootstrap } from "../ui"
import { useAppDispatch, useAppSelector } from "../hooks"
import React, { useCallback } from "react"
import { publishDocument } from "./actions"
import styled from "styled-components"
import Clipboard from "react-clipboard.js"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

const { OverlayTrigger, Tooltip, Spinner } = bootstrap

export function Publish() {
  const authenticated = useAppSelector(s => !!s.cloud.uid)
  return authenticated ? <LoggedIn /> : <NotLoggedIn />
}

export function LoggedIn() {
  const docId = useAppSelector(s => s.io.document?.id),
    docOpen = !!docId,
    dispatch = useAppDispatch(),
    publish = useCallback(() => dispatch(publishDocument(docId!)), [dispatch, docId])

  return <OverlayButton trigger="click" overlay={PublishModal({ publish })} disabled={!docOpen} />
}

function NotLoggedIn() {
  return <OverlayButton overlay={<Tooltip>Sign in to publish</Tooltip>} />
}

const Button = styled(common.Button)``,
  Popover = styled(bootstrap.Popover)`
    pointer-events: all;
  `,
  PopoverBody = styled(bootstrap.Popover.Body)`
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;

    & > * {
      margin-bottom: 0.5rem;
    }

    input {
      margin-right: 0.25rem;
    }
  `,
  OverlayButton: React.FC<{ trigger?: any; overlay: any; disabled?: boolean }> = ({
    trigger,
    overlay,
    disabled
  }) => (
    <OverlayTrigger placement="bottom" trigger={trigger} overlay={overlay}>
      <div style={{ pointerEvents: "all" }}>
        <common.IconButton icon={faShare} disabled={disabled}>
          Share
        </common.IconButton>
      </div>
    </OverlayTrigger>
  ),
  PublishModal = ({ publish }: { publish: () => void }) => (
    <Popover>
      <Popover.Header as="h3">Generate a public link to your patterns</Popover.Header>
      <PopoverBody>
        <Button size="sm" onClick={publish}>
          Publish
        </Button>
        <Status />
      </PopoverBody>
    </Popover>
  ),
  Status = () => {
    const publish = useAppSelector(s => s.cloud.publish)
    switch (publish.status) {
      case "pending":
        return <Spinner animation="border" />
      case "current":
      case "outdated":
        return <TextClipboard value={publish.url} />
      case "error":
        return (
          <div>
            Error: {publish.reason} {publish.code}
          </div>
        )
      default:
        return null
    }
  },
  ClipboardContainer = styled.div`
    display: flex;
  `,
  TextClipboard = ({ value }: { value: string }) => (
    <ClipboardContainer>
      <input type="text" readOnly value={value} />
      <Clipboard className="btn btn-primary btn-sm" data-clipboard-text={value}>
        <FontAwesomeIcon icon={faCopy} />
      </Clipboard>
    </ClipboardContainer>
  )
