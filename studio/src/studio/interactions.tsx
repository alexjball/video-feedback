import { HTMLProps, useMemo } from "react"
import { useDispatch } from "react-redux"
import { rotate, translate, zoom } from "./model"

type Callbacks = Required<
  Pick<
    HTMLProps<HTMLDivElement>,
    "onMouseDown" | "onMouseUp" | "onMouseMove" | "onMouseOut" | "onWheel" | "onContextMenu"
  >
>

export function useInteractions(): Callbacks {
  const dispatch = useDispatch()
  return useMemo(() => {
    let rotating = false,
      translating = false

    const stopInteractions = () => {
        translating = false
        rotating = false
      },
      ignore = (e: any) => e.preventDefault()

    return {
      onMouseDown(e) {
        if (e.button === 0) translating = true
        if (e.button === 2) rotating = true
      },
      onMouseUp(e) {
        if (e.button === 0) translating = false
        if (e.button === 2) rotating = false
      },
      onMouseMove(e) {
        if (translating) {
          const { movementX: dx, movementY: dy } = e
          dispatch(translate({ dx, dy }))
        }
        if (rotating) {
          const { movementX: dx } = e
          dispatch(rotate(dx))
        }
      },
      onContextMenu: ignore,
      onMouseOut: stopInteractions,
      onWheel: e => void dispatch(zoom(e.deltaY))
    }
  }, [dispatch])
}
