import { HTMLProps, useMemo } from "react"
import { useAppDispatch } from "../hooks"
import { toggleShow } from "../stats"
import { drag, rotate, zoom } from "./model"

type Callbacks = Required<
  Pick<
    HTMLProps<HTMLDivElement>,
    | "onMouseDown"
    | "onMouseUp"
    | "onMouseMove"
    | "onMouseOut"
    | "onWheel"
    | "onContextMenu"
    | "onKeyDown"
    | "tabIndex"
  >
>

export function useInteractions(): Callbacks {
  const dispatch = useAppDispatch()
  return useMemo(() => {
    let rotating = false,
      dragging = false

    const stopInteractions = () => {
        dragging = false
        rotating = false
      },
      ignore = (e: any) => e.preventDefault()

    return {
      onMouseDown(e) {
        if (e.button === 0) {
          dragging = true
          dispatch(drag({ x: e.clientX, y: e.clientY, start: true }))
        }
        if (e.button === 2) rotating = true
      },
      onMouseUp(e) {
        if (e.button === 0) {
          dispatch(drag({ x: e.clientX, y: e.clientY, end: true }))
          dragging = false
        }
        if (e.button === 2) rotating = false
      },
      onMouseMove(e) {
        if (dragging) {
          const { clientX: x, clientY: y } = e
          dispatch(drag({ x, y }))
        }
        if (rotating) {
          const { movementX: dx, movementY: dy } = e
          dispatch(rotate({ dx, dy }))
        }
      },
      onContextMenu: ignore,
      onMouseOut: stopInteractions,
      onWheel: e => void dispatch(zoom(e.deltaY)),
      onKeyDown: e => {
        if (e.key === "t") dispatch(toggleShow())
      },
      tabIndex: 0
    }
  }, [dispatch])
}
