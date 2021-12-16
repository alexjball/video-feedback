import React, {
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  RefObject,
  useEffect,
  useRef
} from "react"
import useResizeObserver from "use-resize-observer"

export interface CanvasProps {
  onResize?: (width: number, height: number) => void
}

export type BaseProps = Omit<HTMLAttributes<HTMLDivElement>, "ref">
export type Props = BaseProps & CanvasProps
export type FrameRef = RefObject<HTMLDivElement>
export type CanvasRef = RefObject<HTMLCanvasElement>

export const Canvas = forwardRef(function Canvas(
  { onResize, style, ...divProps }: Props,
  canvas: ForwardedRef<HTMLCanvasElement>
) {
  const frame: FrameRef = useRef(null)

  useResize(frame, onResize)

  return (
    <div style={{ position: "relative", ...style }} ref={frame} {...divProps}>
      <canvas style={{ position: "absolute" }} ref={canvas} />
    </div>
  )
})

function useResize(frame: FrameRef, onResize?: (width: number, height: number) => void) {
  const { width = 0, height = 0 } = useResizeObserver<HTMLDivElement>({ ref: frame }),
    hasSize = Boolean(width && height)
  useEffect(() => {
    if (hasSize) onResize?.(width, height)
  }, [hasSize, height, onResize, width])
  return { frame, hasSize }
}
