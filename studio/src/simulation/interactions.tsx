import { cloneDeep } from "lodash"
import { HTMLProps, PointerEventHandler, useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "../hooks"
import { toggleShow } from "../stats"
import { AppDispatch } from "../store"
import { Gesture, State, updateGesture, zoom } from "./model"
import { getPointer } from "./model/helpers"

/**
 * Interactions:
 * Mouse: drag, zoom, rotate
 * Keyboard: drag, zoom, rotate, toggle panels
 * Touch: drag, zoom rotate
 */
export function useInteractions(): InputProps {
  const dispatch = useAppDispatch()
  const mode = useAppSelector(s => s.simulation.inputMode)
  const [handler, setHandler] = useState<InputHandler>(() => createHandler(dispatch, mode))

  useEffect(() => {
    // Clear the gesture when mode changes away
    if (mode !== "transform") dispatch(updateGesture())
  }, [dispatch, mode])

  useEffect(() => {
    if (handler.mode !== mode) {
      setHandler(createHandler(dispatch, mode))
    }
  }, [dispatch, handler.mode, mode])

  return handler.props
}

const createHandler = (dispatch: AppDispatch, mode: State["inputMode"]): InputHandler => {
  return new {
    paint: PaintHandler,
    transform: TransformHandler
  }[mode](dispatch)
}

const ignore = (e: any) => e.preventDefault()
type Mode = State["inputMode"]
type InputProps = HTMLProps<HTMLDivElement>

abstract class InputHandler {
  p: Gesture = { type: "primary", pointers: [] }

  constructor(readonly dispatch: AppDispatch, readonly mode: Mode) {}

  get props(): InputProps {
    return this.baseProps()
  }

  baseProps(): InputProps {
    return {
      tabIndex: 0,
      onContextMenu: ignore,
      onKeyDown: e => {
        if (e.key === "t") this.dispatch(toggleShow())
      },
      onPointerDown: this.addPointer,
      onPointerMove: this.movePointer,
      onPointerUp: this.removePointer,
      onPointerCancel: this.removePointer,
      onPointerLeave: this.removePointer,
      onPointerOut: this.removePointer
    }
  }

  abstract onGesture(): void

  addPointer: PointerHandler = e => {
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
    this.onGesture()
  }

  movePointer: PointerHandler = e => {
    const pointer = getPointer(this.p, e.pointerId)!
    if (!pointer) return

    pointer.x = e.clientX
    pointer.y = e.clientY
    this.onGesture()
  }

  removePointer: PointerHandler = e => {
    const i = this.p.pointers.findIndex(p => p.id === e.pointerId)
    if (i !== -1) {
      this.p.pointers.splice(i, 1)
      this.onGesture()
    }
  }
}

type PointerHandler = PointerEventHandler<HTMLDivElement>
class TransformHandler extends InputHandler {
  override get props(): InputProps {
    return {
      ...this.baseProps(),
      onWheel: e => void this.dispatch(zoom(e.deltaY))
    }
  }

  constructor(dispatch: AppDispatch) {
    super(dispatch, "transform")
  }

  override onGesture() {
    this.dispatch(updateGesture(cloneDeep(this.p)))
  }
}

class PaintHandler extends InputHandler {
  activeId?: number

  constructor(dispatch: AppDispatch) {
    super(dispatch, "paint")
  }

  override get props(): InputProps {
    return {
      ...this.baseProps()
    }
  }

  override onGesture(): void {
    const active = this.p.pointers.find(p => p.id === this.activeId)
    if (active) {
      this.dispatch(pushOperation({ x: active.x, y: active.y }))
    }
  }
}
