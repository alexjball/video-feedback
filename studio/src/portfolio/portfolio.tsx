import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons"
import { isFulfilled } from "@reduxjs/toolkit"
import router, { useRouter } from "next/router"
import { useCallback, useMemo, useState } from "react"
import styled from "styled-components"
import { Account } from "../cloud"
import { useAppDispatch, useAppSelector } from "../hooks"
import * as io from "../io"
import { bootstrap, common } from "../ui"
import { usePortfolio } from "./hooks"
import { setSelected } from "./model"
import Link from "next/link"

const { Container, Col, Row, Spinner, ListGroup } = bootstrap

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
          These patterns are stored locally on your computer. You can sign in to publish and share
          links to your work.
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
        New
      </Button>
    )
  },
  Open = () => {
    const id = useAppSelector(s => s.portfolio.selected)
    return (
      <Link href={`/edit?doc=${id}`} passHref>
        <Button disabled={!id}>Open</Button>
      </Link>
    )
  },
  Commands = () => {
    const hasSelection = useAppSelector(s => !!s.portfolio.selected)
    return (
      <Row>
        <CommandContainer className="mb-2">{hasSelection ? <Open /> : <Create />}</CommandContainer>
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
      select = useCallback(() => dispatch(setSelected(document.id)), [dispatch, document.id])
    return (
      // <ListGroupItem onClick={select} className="d-flex flex-row border-0" key={document.id} action>
      //   <FormCheck readOnly className="align-self-center" checked={selected} type="checkbox" />
      //   <DocumentCard className="flex-grow-1 ms-2" document={document} />
      // </ListGroupItem>
      <ListGroupItem className="d-flex flex-row border-0" key={document.id} action>
        {/* <FormCheck readOnly className="align-self-center" checked={selected} type="checkbox" /> */}
        <DocumentCard className="flex-grow-1 ms-2" document={document} />
      </ListGroupItem>
    )
  },
  DocumentCard: React.FC<{ document: io.model.Document; className?: string }> = ({
    document,
    className
  }) => {
    const router = useRouter()
    return (
      <Card
        onClick={() => router.push(`/edit?doc=${document.id}`)}
        className={className}
        style={{ userSelect: "none" }}>
        <Card.Body>
          <Card.Title>{document.id}</Card.Title>
          <ThumbnailContainer>
            {document.keyframes.map(k => (
              <Thumbnail key={k.id} src={k.thumbnail} />
            ))}
          </ThumbnailContainer>
        </Card.Body>
      </Card>
    )
  },
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
    transition: transform 0.2s;
    :hover {
      transform: scale(1.02);
    }
    :active {
      transform: scale(0.98);
    }
  `,
  ListGroupItem = styled(bootstrap.ListGroupItem)`
    color: unset !important;
    padding: 0.5rem;

    :hover input {
      :checked {
        transform: scale(1.2);
      }
      :not(:checked) {
        transform: scale(1.5);
      }
      opacity: 1;
    }

    :active input {
      transform: scale(0.7) !important;
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
