import React, { HTMLAttributes, RefObject, useEffect, useMemo, useRef } from "react"
import { WebGLRenderer } from "three"
import useResizeObserver from "use-resize-observer"

export interface Renderer {
  onRender?: (renderer: WebGLRenderer) => void
  onDispose?: () => void
  onResize?: (width: number, height: number) => void
}
export type Props = HTMLAttributes<HTMLDivElement> & Renderer
export type FrameRef = RefObject<HTMLDivElement>
export type WrapperProps = Omit<Props, "renderer">

export function Three({ onRender, onDispose, onResize, style, ...divProps }: Props) {
  const frame: FrameRef = useRef(null)
  const renderer = useInternalRenderer({ onRender, onDispose, onResize })

  // Order matters here! Effects run in the order they're called
  useInit(renderer, frame)
  const { hasSize } = useResize(renderer, frame)
  useRenderLoop(renderer, hasSize)
  useDispose(renderer)

  return <div style={{ position: "relative", ...style }} ref={frame} {...divProps} />
}

interface InternalRenderer {
  init(): HTMLCanvasElement
  setSize(width: number, height: number): void
  renderFrame(): void
  dispose(): void
}

function useInternalRenderer({ onDispose, onRender, onResize }: Renderer): InternalRenderer {
  return useMemo(() => {
    let renderer: WebGLRenderer
    return {
      init() {
        renderer = new WebGLRenderer({ antialias: true })
        return renderer.domElement
      },
      setSize(width: number, height: number) {
        renderer.setSize(width, height)
        onResize?.(width, height)
      },
      renderFrame() {
        onRender?.(renderer)
      },
      dispose() {
        onDispose?.()
        renderer.dispose()
        renderer = undefined!
      }
    }
  }, [onDispose, onRender, onResize])
}

function useDispose(renderer: InternalRenderer) {
  useEffect(() => () => renderer.dispose(), [renderer])
}

function useInit(renderer: InternalRenderer, frame: FrameRef) {
  useEffect(() => {
    const container = frame.current!,
      element = renderer.init()
    element.style.cssText = ""
    element.style.position = "absolute"
    container.appendChild(element)
    return () => void container.removeChild(element)
  }, [frame, renderer])
}

function useResize(renderer: InternalRenderer, frame: FrameRef) {
  const { width = 0, height = 0 } = useResizeObserver<HTMLDivElement>({ ref: frame }),
    hasSize = Boolean(width && height)
  useEffect(() => {
    if (hasSize) renderer.setSize(width, height)
  }, [hasSize, height, renderer, width])
  return { frame, hasSize }
}

function useRenderLoop(renderer: InternalRenderer, hasSize: boolean) {
  const loop = useMemo(() => {
    let animationRequest: null | number = null

    return {
      startAnimating() {
        this.stopAnimating()
        this.loop()
      },

      loop() {
        animationRequest = requestAnimationFrame(() => {
          renderer.renderFrame()
          this.loop()
        })
      },

      stopAnimating() {
        if (animationRequest !== null) {
          cancelAnimationFrame(animationRequest)
          animationRequest = null
        }
      }
    }
  }, [renderer])

  useEffect(() => {
    if (hasSize) loop.startAnimating()
    return () => loop.stopAnimating()
  }, [hasSize, loop, renderer])
}
