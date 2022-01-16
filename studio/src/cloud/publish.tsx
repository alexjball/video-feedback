/* eslint-disable react/no-children-prop */
import { faShare, faCopy } from "@fortawesome/free-solid-svg-icons"
import { common, bootstrap } from "../ui"
import { useAppDispatch, useAppSelector } from "../hooks"
import React, { useCallback, useRef, useState } from "react"
import { publishDocument } from "./actions"
import styled from "styled-components"
import Clipboard from "react-clipboard.js"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { forwardRef } from "react"
import { useEffect } from "react"
import { OverlayInjectedProps } from "react-bootstrap/esm/Overlay"
import { Publication, usePublication } from "./model"

const { OverlayTrigger, Tooltip, Spinner, Overlay } = bootstrap
const { TooltipButton } = common

export function Publish({ docId: id, parentFocused, ...props }: any) {
  const authenticated = useAppSelector(s => !!s.cloud.uid)
  const docId = useAppSelector(s => id ?? s.io.document?.id)

  return authenticated ? (
    <LoggedIn {...props} docId={docId} parentFocused={parentFocused} />
  ) : (
    <NotLoggedIn {...props} />
  )
}

export function LoggedIn({ docId, parentFocused, ...props }: any) {
  const dispatch = useAppDispatch(),
    [showModal, setShowModal] = useState(false),
    [showTooltip, setShowTooltip] = useState(false),
    publish = usePublication(docId),
    onClick = useCallback(() => {
      if (!showModal) {
        setShowModal(true)
        if (publish.status !== "current") dispatch(publishDocument(docId!))
      } else {
        setShowModal(false)
      }
    }, [dispatch, docId, publish.status, showModal]),
    target = useRef(null),
    disabled = !docId

  useEffect(() => {
    if (!parentFocused) setShowModal(false)
  }, [parentFocused])

  return (
    <>
      <TooltipButton
        defaultShow={false}
        onToggle={s => setShowTooltip(s)}
        showTooltip={showTooltip && !showModal}
        ref={target}
        icon={faShare}
        tooltip={"Publish"}
        onClick={onClick}
        disabled={disabled}
        {...props}
      />
      <Overlay target={target.current} show={showModal} placement="bottom">
        {props => <PublishStatus {...props} publish={publish} />}
      </Overlay>
    </>
  )
}

function NotLoggedIn(props: any) {
  return <TooltipButton icon={faShare} {...props} disabled={true} tooltip="Sign in to publish" />
}

const PublishStatus = forwardRef<HTMLDivElement, OverlayInjectedProps & { publish: Publication }>(
    function PublishModal({ popper, publish, ...props }, ref) {
      const { status, header, body } = useStatus(publish)
      useEffect(() => popper.scheduleUpdate?.(), [popper, status])

      return (
        <Popover
          {...props}
          onFocus={() => console.log("focus")}
          onBlur={() => console.log("blur")}
          ref={ref}>
          <Popover.Header>{header}</Popover.Header>
          <PopoverBody>{body}</PopoverBody>
        </Popover>
      )
    }
  ),
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
  useStatus = (publish: Publication) => {
    const status = publish.status
    switch (status) {
      case "pending":
        return { status, header: "Publishing...", body: <Spinner animation="border" /> }
      case "current":
      case "outdated":
        return { status, header: "Published", body: <TextClipboard value={publish.url} /> }
      case "error":
        return {
          status,
          header: "Error",
          body: (
            <div>
              Error: {publish.reason} {publish.code}
            </div>
          )
        }
      default:
        return { status, header: "Unknown Error", body: null }
    }
  },
  TextClipboard = ({ value }: { value: string }) => (
    <div className="d-flex">
      <input type="text" readOnly value={value} />
      <Clipboard className="btn btn-primary btn" data-clipboard-text={value}>
        <FontAwesomeIcon icon={faCopy} />
      </Clipboard>
    </div>
  )
