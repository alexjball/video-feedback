import { PointerEvent, PointerEventHandler, useCallback, useState } from "react"
import styled from "styled-components"
import { Canvas, Props } from "./canvas"
import { Button } from "./ui/common"
import { createService } from "./utils"

const service = createService<OffscreenCanvas>()
export const { Provider, useService: usePaintCanvas } = service

export const PaintPanel = styled(props => {
  const [paint, setPaint] = useState<Paint | undefined>(undefined)
  service.useBinding(paint?.offscreen)

  const init = useCallback((canvas: HTMLCanvasElement | null) => {
    if (canvas) setPaint(new Paint(canvas))
  }, [])

  return (
    <div {...props}>
      <Canvas className="canvas" {...paint?.props} ref={init} />
      <Button className="mt-2" onClick={paint?.clear}>
        Clear
      </Button>
    </div>
  )
})`
  .canvas {
    width: 20vw;
    height: 20vh;
    outline: 2px solid red;
  }
  pointer-events: all;
`

type Handler = PointerEventHandler<HTMLDivElement>

class Paint {
  offscreen: OffscreenCanvas
  ctx: OffscreenCanvasRenderingContext2D

  get props(): Props {
    return {
      onPointerDown: this.addPointer,
      onPointerMove: this.movePointer,
      onPointerUp: this.removePointer,
      onPointerCancel: this.removePointer,
      onPointerLeave: this.removePointer,
      onPointerOut: this.removePointer,
      onResize: (width, height) => {
        this.ctx.canvas.width = width
        this.ctx.canvas.height = height
      }
    }
  }

  constructor(public canvas: HTMLCanvasElement) {
    this.offscreen = canvas.transferControlToOffscreen()
    const ctx = this.offscreen.getContext("2d")
    if (!ctx) throw new Error("2d offscreen context unsupported")
    this.ctx = ctx
  }

  pointer: { x: number; y: number; id: number } | undefined

  clear = () => {
    const canvas = this.ctx.canvas
    this.ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  addPointer: Handler = e => {
    if (this.pointer) return
    console.log("add", e)

    this.updatePointer(e)
    this.drawPointer()
  }

  movePointer: Handler = e => {
    if (this.pointer?.id !== e.pointerId) return
    console.log("move", e)
    this.updatePointer(e)
    this.drawPointer()
  }

  removePointer: Handler = e => {
    if (this.pointer?.id === e.pointerId) this.pointer = undefined
    console.log("remove", e)
  }

  updatePointer(e: PointerEvent<HTMLDivElement>) {
    const bounds = this.canvas.getBoundingClientRect()
    this.pointer = { id: e.pointerId, x: e.clientX - bounds.x, y: e.clientY - bounds.y }
  }

  drawPointer() {
    const { ctx, pointer } = this
    if (!pointer) return
    console.log(pointer)

    ctx.fillStyle = "red"
    ctx.beginPath()
    ctx.ellipse(pointer.x, pointer.y, 5, 5, 0, 0, 2 * Math.PI)
    ctx.fill()
  }
}
