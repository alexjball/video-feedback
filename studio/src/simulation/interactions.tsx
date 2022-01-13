import { cloneDeep } from "lodash"
import { HTMLProps, PointerEventHandler, useMemo } from "react"
import { useAppDispatch } from "../hooks"
import { toggleShow } from "../stats"
import { AppDispatch } from "../store"
import { Gesture, updateGesture, zoom } from "./model"
import { getPointer } from "./model/helpers"

type DivProps = Required<HTMLProps<HTMLDivElement>>
type PointerCallbacks = Pick<
  DivProps,
  | "onPointerDown"
  | "onPointerMove"
  | "onPointerUp"
  | "onPointerCancel"
  | "onPointerLeave"
  | "onPointerOut"
>
type Callbacks = Pick<DivProps, "onWheel" | "onContextMenu" | "onKeyDown" | "tabIndex"> &
  PointerCallbacks

/**
 * Interactions:
 * Mouse: drag, zoom, rotate
 * Keyboard: drag, zoom, rotate, toggle panels
 * Touch: drag, zoom rotate
 */
export function useInteractions(): Callbacks {
  const dispatch = useAppDispatch()
  return useMemo(() => {
    let rotating = false,
      dragging = false

    const stopInteractions = () => {
        dragging = false
        rotating = false
      },
      ignore = (e: any) => e.preventDefault(),
      pointer = new PointerControl(dispatch)

    return {
      tabIndex: 0,

      onWheel: e => void dispatch(zoom(e.deltaY)),
      onContextMenu: ignore,

      onPointerDown: pointer.addPointer,
      onPointerMove: pointer.movePointer,
      onPointerUp: pointer.removePointer,
      onPointerCancel: pointer.removePointer,
      onPointerLeave: pointer.removePointer,
      onPointerOut: pointer.removePointer,

      onKeyDown: e => {
        if (e.key === "t") dispatch(toggleShow())
      }
    }
  }, [dispatch])
}

type Handler = PointerEventHandler<HTMLDivElement>
class PointerControl {
  dispatch
  p: Gesture = { type: "primary", pointers: [] }

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch
  }

  private updateGesture() {
    this.dispatch(updateGesture(cloneDeep(this.p)))
  }

  addPointer: Handler = e => {
    if (this.p.pointers.length >= 2) {
      return
    } else if (this.p.pointers.length === 0) {
      this.p.type = e.button === 0 ? "primary" : "alternate"
    }
    this.p.pointers.push({
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY
    })
    this.updateGesture()
  }

  movePointer: Handler = e => {
    const pointer = getPointer(this.p, e.pointerId)!
    if (!pointer) return

    pointer.x = e.clientX
    pointer.y = e.clientY
    this.updateGesture()
  }

  removePointer: Handler = e => {
    const i = this.p.pointers.findIndex(p => p.id === e.pointerId)
    if (i !== -1) {
      this.p.pointers.splice(i, 1)
      this.updateGesture()
    }
  }
}
