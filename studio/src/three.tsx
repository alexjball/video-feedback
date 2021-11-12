import { DependencyList, HTMLAttributes, RefObject, useEffect, useMemo, useRef } from "react"
import { Camera, Scene, Vector2, WebGLRenderer, WebGLRenderTarget } from "three"
import useResizeObserver from "use-resize-observer"

export interface Renderer {
  init(canvas: HTMLCanvasElement): void
  setSize(width: number, height: number): void
  renderFrame(): void
  dispose(): void
}

export interface Props extends HTMLAttributes<HTMLDivElement> {
  renderer: Renderer
}

type FrameRef = RefObject<HTMLDivElement>
type CanvasRef = RefObject<HTMLCanvasElement>

export function Three({ renderer, ...divProps }: Props) {
  const canvas: CanvasRef = useRef(null)

  // Order matters here! Effects run in the order they're called
  useInit(renderer, canvas)
  const { frame, hasSize } = useResize(renderer)
  useRenderLoop(renderer, canvas, hasSize)
  useDispose(renderer)

  return (
    <div style={{ backgroundColor: "grey", position: "relative" }} ref={frame} {...divProps}>
      <canvas style={{ position: "absolute" }} ref={canvas} />
    </div>
  )
}

function useDispose(renderer: Renderer) {
  useEffect(() => () => renderer.dispose(), [renderer])
}

function useInit(renderer: Renderer, canvas: CanvasRef) {
  useEffect(() => {
    if (canvas.current) renderer.init(canvas.current)
  }, [canvas, renderer])
}

function useResize(renderer: Renderer) {
  const frame: FrameRef = useRef(null)
  const { width = 0, height = 0 } = useResizeObserver<HTMLDivElement>({ ref: frame }),
    hasSize = Boolean(width && height)
  useEffect(() => {
    if (hasSize) renderer.setSize(width, height)
  }, [hasSize, height, renderer, width])
  return { frame, hasSize }
}

function useRenderLoop(renderer: Renderer, canvas: CanvasRef, hasSize: boolean) {
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
    if (canvas.current && hasSize) loop.startAnimating()
    return () => loop.stopAnimating()
  }, [canvas, hasSize, loop, renderer])
}

/**
 * Class-based Renderer pattern that uses the constructor and inheritance to
 * provide common rendering support. The React components work better with
 * functional interfaces, and `useRenderer` adapts between the two patterns.
 */
export class BaseRenderer implements Renderer {
  readonly renderer

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true })
  }

  init(): void {
    throw Error("Canvas is initialized in the constructor")
  }

  renderFrame(): void {}

  dispose(): void {
    this.renderer.dispose()
  }

  setSize(width: number, height: number) {
    this.renderer.setSize(width, height)
  }

  get size() {
    const size = new Vector2()
    this.renderer.getSize(size)
    return { width: size.x, height: size.y }
  }

  renderScene(scene: Scene, camera: Camera, target: WebGLRenderTarget | null) {
    this.renderer.setRenderTarget(target)
    this.renderer.render(scene, camera)
  }
}

type CreateRenderer = (canvas: HTMLCanvasElement) => BaseRenderer

/** Bridges the functional react and class-based renderer patterns */
export function useRenderer(createRenderer: CreateRenderer, deps: DependencyList = []): Renderer {
  return useMemo(() => {
    let renderer: BaseRenderer
    return {
      init(canvas: HTMLCanvasElement) {
        renderer = createRenderer(canvas)
      },
      setSize(width: number, height: number) {
        renderer.setSize(width, height)
      },
      renderFrame() {
        renderer.renderFrame()
      },
      dispose() {
        renderer.dispose()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createRenderer, ...deps])
}

export type WrapperProps = Omit<Props, "renderer">
export const asComponent = <T extends typeof BaseRenderer>(MyRenderer: T) =>
  function ThreeWrapper(props: WrapperProps) {
    const renderer = useRenderer(canvas => new MyRenderer(canvas))
    return <Three {...props} renderer={renderer} />
  }
