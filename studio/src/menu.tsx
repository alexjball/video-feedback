import { faFileDownload } from "@fortawesome/free-solid-svg-icons"
import saveAs from "file-saver"
import { useCallback } from "react"
import styled from "styled-components"
import { login, publish } from "./cloud"
import { useAppDispatch, useAppSelector } from "./hooks"
import * as simulation from "./simulation"
import { common } from "./ui"

const Menu = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.8;
    user-select: none;

    & > * {
      margin: 0.5rem;
    }

    :hover {
      opacity: 1;
    }
  `,
  { Button, IconButton } = common

export const MenuPanel = (props: any) => {
  const service = simulation.useService(),
    feedbackHeight = useAppSelector(s => s.simulation.feedback.resolution.height)
  const clear = useCallback(() => service?.clearFrames(true, true), [service]),
    download = (height: number) =>
      service
        ?.convert(height)
        .then(({ blob }) => {
          saveAs(blob, "feedback")
        })
        .catch(e => {
          console.error(e)
          alert("Couldn't save feedback")
        })

  return (
    <Menu {...props}>
      <Recenter />
      <Button onClick={clear}>Clear Screen</Button>
      <IconButton icon={faFileDownload} onClick={() => download(feedbackHeight)}>
        Download
      </IconButton>
      <publish.Publish />
      <login.Account />
    </Menu>
  )
}

function Recenter() {
  const dispatch = useAppDispatch()
  const onClick = useCallback(() => dispatch(simulation.model.center()), [dispatch])
  return <Button onClick={onClick}>Recenter</Button>
}
