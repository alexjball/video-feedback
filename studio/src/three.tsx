import { DependencyList, HTMLAttributes, RefObject, useEffect, useMemo, useRef } from "react"
import { Camera, Scene, Vector2, WebGLRenderer, WebGLRenderTarget } from "three"
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer"
import useResizeObserver from "use-resize-observer"
import { useAppStore } from "./hooks"
import type { AppStore } from "./store"

export interface Renderer {
  init(): LibContainerElement
  setSize(width: number, height: number): void
  renderFrame(): void
  dispose(): void
}

export interface Props extends HTMLAttributes<HTMLDivElement> {
  renderer: Renderer
}

type FrameRef = RefObject<HTMLDivElement>
type CanvasRef = RefObject<HTMLCanvasElement>

export function Three({ renderer, style, ...divProps }: Props) {
  const frame: FrameRef = useRef(null)

  // Order matters here! Effects run in the order they're called
  useInit(renderer, frame)
  const { hasSize } = useResize(renderer, frame)
  useRenderLoop(renderer, hasSize)
  useDispose(renderer)

  return <div style={{ position: "relative", ...style }} ref={frame} {...divProps} />
}

function useDispose(renderer: Renderer) {
  useEffect(() => () => renderer.dispose(), [renderer])
}

function useInit(renderer: Renderer, frame: FrameRef) {
  useEffect(() => {
    const container = frame.current!,
      element = renderer.init()
    element.style.cssText = ""
    element.style.position = "absolute"
    container.appendChild(element)
    return () => void container.removeChild(element)
  }, [frame, renderer])
}

function useResize(renderer: Renderer, frame: FrameRef) {
  const { width = 0, height = 0 } = useResizeObserver<HTMLDivElement>({ ref: frame }),
    hasSize = Boolean(width && height)
  useEffect(() => {
    if (hasSize) renderer.setSize(width, height)
  }, [hasSize, height, renderer, width])
  return { frame, hasSize }
}

function useRenderLoop(renderer: Renderer, hasSize: boolean) {
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

class SVGRendererCompat extends SVGRenderer {
  dispose() {}
}

type RendererMethods = "domElement" | "getSize" | "setSize" | "dispose"
type LibRenderer = Pick<SVGRendererCompat, RendererMethods> | Pick<WebGLRenderer, RendererMethods>
type LibContainerElement = Node & Pick<HTMLElement, "style">

/**
 * Class-based Renderer pattern that uses the constructor and inheritance to
 * provide common rendering support. The React components work better with
 * functional interfaces, and `useRenderer` adapts between the two patterns.
 */
class BaseRenderer<T extends LibRenderer> implements Renderer {
  readonly store: AppStore
  readonly renderer: T

  constructor(renderer: T, store: AppStore) {
    this.renderer = renderer
    this.store = store
  }

  get state() {
    return this.store.getState()
  }

  init() {
    return this.renderer.domElement
  }

  dispose(): void {
    this.renderer.dispose()
  }

  renderFrame() {}

  setSize(width: number, height: number) {
    this.renderer.setSize(width, height)
  }
}

export class WebGlRenderer extends BaseRenderer<WebGLRenderer> {
  constructor(store: AppStore) {
    super(new WebGLRenderer({ antialias: true }), store)
  }

  renderScene = (scene: Scene, camera: Camera, target: WebGLRenderTarget | null) => {
    this.renderer.setRenderTarget(target)
    this.renderer.render(scene, camera)
  }
  get size() {
    const size = new Vector2()
    this.renderer.getSize(size)
    return { width: size.x, height: size.y }
  }
}

export class SvgRenderer extends BaseRenderer<SVGRendererCompat> {
  constructor(store: AppStore) {
    super(new SVGRendererCompat(), store)
  }

  renderScene = (scene: Scene, camera: Camera) => {
    this.renderer.render(scene, camera)
  }
  get size() {
    return this.renderer.getSize()
  }
}

type CreateRenderer = () => Renderer

/** Bridges the functional react and class-based renderer patterns */
// TODO: How much of this could be a hook or a react component? Is is it
// performant to render at 60 fps?
export function useRenderer(createRenderer: CreateRenderer, deps: DependencyList = []): Renderer {
  return useMemo(() => {
    let renderer: Renderer
    return {
      init() {
        renderer = createRenderer()
        return renderer.init()
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
export const asComponent = <T extends { new (store: AppStore): Renderer }>(MyRenderer: T) =>
  function ThreeWrapper(props: WrapperProps) {
    const store = useAppStore()
    const renderer = useRenderer(() => new MyRenderer(store))
    return <Three {...props} renderer={renderer} />
  }
