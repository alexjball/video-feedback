import saveAs from "file-saver"
import { useCallback } from "react"
import styled from "styled-components"
import { useAppDispatch, useAppSelector } from "./hooks"
import * as simulation from "./simulation"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFileDownload, faShare } from "@fortawesome/free-solid-svg-icons"

const Menu = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.8;
    user-select: none;

    :hover {
      opacity: 1;
    }
  `,
  Button = styled.button`
    pointer-events: all;
    margin: 10px;
  `

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
      <Button onClick={() => download(feedbackHeight)}>
        <FontAwesomeIcon icon={faFileDownload} size={"lg"} />
      </Button>
      {/* <Button onClick={() => alert("hey!")}>
        <FontAwesomeIcon icon={faShare} size={"lg"} />
      </Button> */}
    </Menu>
  )
}

function Recenter() {
  const dispatch = useAppDispatch()
  const onClick = useCallback(() => dispatch(simulation.model.center()), [dispatch])
  return <Button onClick={onClick}>Recenter</Button>
}
