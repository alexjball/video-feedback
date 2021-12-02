import { useCallback } from "react"
import styled from "styled-components"
import { useAppDispatch } from "./hooks"
import { center } from "./simulation/model"

const Navigation = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  opacity: 0.8;
  user-select: none;

  :hover {
    opacity: 1;
  }

  button {
    pointer-events: all;
  }
`

export const NavigationPanel = (props: any) => (
  <Navigation {...props}>
    <Recenter />
  </Navigation>
)

function Recenter() {
  const dispatch = useAppDispatch()
  const onClick = useCallback(() => dispatch(center()), [dispatch])
  return <button onClick={onClick}>Recenter</button>
}
