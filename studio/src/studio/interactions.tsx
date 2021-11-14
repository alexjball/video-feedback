import { HTMLProps, useMemo } from "react"
import { useDispatch } from "react-redux"
import { rotate, translate } from "./model"

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
      translating = false,
      zooming = false

    const stopInteractions = () => {
        translating = false
        rotating = false
        zooming = false
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
      onWheel(e) {
        // const { deltaY: dZ } = e,
        //   pixelsPerScale = 1e3,
        //   spacemap = this.renderer.system.feedback.spacemap
        // spacemap.scale.x += dZ / pixelsPerScale
        // spacemap.scale.y += dZ / pixelsPerScale
        // console.log(dZ, pixelsPerScale, spacemap.scale)
      }
    }
  }, [dispatch])
}
