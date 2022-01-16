import { faCopy, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons"
import { isFulfilled } from "@reduxjs/toolkit"
import classNames from "classnames"
import Link from "next/link"
import router from "next/router"
import { useCallback, useRef, useState } from "react"
import styled from "styled-components"
import { Account, Publish } from "../cloud"
import db from "../db"
import { useAppDispatch, useAppSelector } from "../hooks"
import * as io from "../io"
import { bootstrap, common } from "../ui"
import { usePortfolio } from "./hooks"
import * as model from "./model"

const { TooltipButton } = common
const { Container, Col, Row, Spinner, ListGroup, Form } = bootstrap

// TODO: Unify the checkbox and clickable-card UI's
export default function Portfolio() {
  const portfolio = usePortfolio()
  return (
    <Container className="mt-3">
      <Row>
        <Col as="h1">Your Portfolio</Col>
        <Col className="d-flex flex-column align-items-end">
          <Account />
        </Col>
      </Row>
      <Row>
        <Col as="p">
          These patterns are stored locally on your device. You can sign in to publish and share
          links to your work from the editor. View the source code and file feedback on{" "}
          <a href="https://github.com/alexjball/video-feedback">Github</a>.
        </Col>
      </Row>
      <Commands />
      <Row>
        <Col className="d-flex flex-column align-items-center">
          <PatternList docs={portfolio.docs} />
        </Col>
      </Row>
    </Container>
  )
}

const Button = styled(common.Button)``,
  CommandContainer = styled(Col)`
    & > :not(:first-child) {
      margin-left: 1rem;
    }
  `,
  Create = () => {
    const dispatch = useAppDispatch(),
      service = io.useService(),
      [loading, setLoading] = useState(false),
      openNew = useCallback(async () => {
        if (service) {
          setLoading(true)
          try {
            const r = await dispatch(io.actions.openDocument({ create: true, io: service }))
            if (isFulfilled(r)) {
              router.push(`/edit?doc=${r.payload.id}`)
            }
          } finally {
            setLoading(false)
          }
        }
      }, [dispatch, service])
    return (
      <Button disabled={loading} onClick={openNew}>
        New Pattern
      </Button>
    )
  },
  Commands = () => {
    return (
      <Row>
        <CommandContainer className="mb-2">
          <Create />
        </CommandContainer>
      </Row>
    )
  }

function PatternList({ docs }: { docs: io.model.Document[] | null }) {
  if (!docs) return <Spinner animation="border" />
  return (
    <ListGroup className="w-100">
      {docs.map(doc => (
        <ListItem key={doc.id} document={doc} />
      ))}
    </ListGroup>
  )
}

const ListItem: React.FC<{ document: io.model.Document }> = ({ document }) => {
    const dispatch = useAppDispatch(),
      selected = useAppSelector(s => s.portfolio.selected === document.id),
      select = useCallback(() => dispatch(model.setSelected(document.id)), [dispatch, document.id])
    return (
      // <ListGroupItem onClick={select} className="d-flex flex-row border-0" key={document.id} action>
      //   <FormCheck readOnly className="align-self-center" checked={selected} type="checkbox" />
      //   <DocumentCard className="flex-grow-1 ms-2" document={document} />
      // </ListGroupItem>
      <ListGroupItem
        forwardedAs="div"
        className="d-flex flex-row border-0"
        key={document.id}
        action
        active={selected}>
        {/* <FormCheck readOnly className="align-self-center" checked={selected} type="checkbox" /> */}
        <DocumentCard
          className="flex-grow-1"
          selected={selected}
          onClick={select}
          document={document}
        />
      </ListGroupItem>
    )
  },
  DocumentCard: React.FC<{
    document: io.model.Document
    className?: string
    onClick?: () => void
    selected?: boolean
  }> = ({ document, selected, className, onClick }) => {
    return (
      <Card className={className} onClick={onClick} style={{ userSelect: "none" }}>
        <Card.Body className="pt-2">
          <div className="d-flex">
            <Title className="w-50 me-2" document={document} />
            <div className="flex-grow-1" />
            <Link href={`/edit?doc=${document.id}`} passHref>
              <CardButton tooltip={"Edit"} icon={faEdit} />
            </Link>
            <PublishButton parentFocused={!!selected} docId={document.id} />
            <Delete document={document} />
          </div>
          <ThumbnailContainer>
            {document.keyframes.map(k => (
              <Thumbnail key={k.id} src={k.thumbnail} />
            ))}
          </ThumbnailContainer>
        </Card.Body>
      </Card>
    )
  },
  CardButton = styled(TooltipButton).attrs(p => ({
    className: classNames(p.className, "ms-2", "align-self-center")
  }))`
    transition: all 0.3s;
    opacity: 0;
  `,
  PublishButton = styled(Publish).attrs(p => ({
    className: classNames(p.className, "ms-2", "align-self-center")
  }))`
    opacity: 0;
    transition: all 0.3s;
  `,
  Delete = ({ document }: { document: io.model.Document }) => {
    const [show, setShow] = useState(false),
      [confirming, setConfirming] = useState(false),
      onClick = useCallback(() => {
        if (confirming) {
          setConfirming(false)
          db.documents.delete(document.id).catch(e => console.error("Could not delete document", e))
        } else {
          setConfirming(true)
        }
      }, [confirming, document.id]),
      onToggle = useCallback((nextShow: boolean) => {
        if (!nextShow) setConfirming(false)
        setShow(nextShow)
      }, [])
    return (
      <CardButton
        showTooltip={show}
        tooltip={confirming ? "Are you sure?" : "Delete"}
        variant={confirming ? "danger" : "primary"}
        icon={faTrash}
        onClick={onClick}
        onToggle={onToggle}
      />
    )
  },
  Title = ({ document, className }: { document: io.model.Document; className: string }) => {
    const [title, setTitle] = useState(document.name ?? ""),
      timeout = useRef<ReturnType<typeof setTimeout>>(),
      dispatch = useAppDispatch(),
      updateTitle = useCallback(
        (title: string) => {
          if (timeout.current) clearTimeout(timeout.current)
          setTitle(title)
          timeout.current = setTimeout(
            () => dispatch(model.updateTitle({ id: document.id, title })),
            1000
          )
        },
        [dispatch, document.id]
      )
    return (
      <TitleInput
        type="text"
        className={"fs-5 mb-2 " + className}
        value={title}
        onChange={(e: any) => updateTitle(e.target.value)}
        onClick={(e: any) => e.stopPropagation()}
        placeholder="Untitled"
      />
    )
  },
  TitleInput = styled(Form.Control)`
    &,
    :focus {
      background-color: transparent;
      color: var(--bs-body-color);
    }
    border: none;
    border-bottom: 2px solid rgba(0, 0, 0, 0);
    border-radius: 0;
    transition: all 0.3s;
  `,
  FormCheck = styled(bootstrap.FormCheck)`
    /* cursor: pointer; */
    input {
      transition: all 0.2s;
      opacity: 0;

      :checked {
        opacity: 1;
      }
    }
  `,
  Card = styled(bootstrap.Card)`
    /* transition: transform 0.2s;
    &:hover {
      transform: scale(1.02);
    }
    :active input:active {
      transform: scale(1);
    }
    &:active {
      transform: scale(0.98);
    } */
  `,
  ListGroupItem = styled(bootstrap.ListGroupItem)`
    padding: 0.5rem;
    cursor: unset !important;
    @media (prefers-color-scheme: dark) {
      background-color: var(--bs-gray-900);
    }

    ${Card}:hover ${TitleInput}, &.active ${TitleInput} {
      border-bottom: 2px solid var(--bs-primary);
      transform: scale(1.05);
    }

    ${Card}:hover ${CardButton}, 
    ${CardButton}:focus, 
    &.active ${CardButton}, 
    ${Card}:hover ${PublishButton}, 
    ${PublishButton}:focus, 
    &.active ${PublishButton} {
      opacity: 1;
    }
  `,
  ThumbnailContainer = styled.div`
    display: flex;
    overflow-x: auto;
  `,
  Thumbnail = styled.img`
    max-width: 150px;
    max-height: 150px;
    object-fit: contain;
    display: flex;
    justify-content: center;
    margin-right: 0.5rem;
    margin-left: 0.5rem;
    border-radius: 10px;
  `
