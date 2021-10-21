import classNames from "classnames"
import { useEffect, useRef } from "react"
import { WebGLRenderer } from "three"
import useResizeObserver from "use-resize-observer"
import styles from "./three.module.css"

export interface RendererConstructor {
  new (canvas: HTMLCanvasElement): Renderer
}

export function Three<T extends Renderer>({
  className,
  renderer
}: {
  className?: string
  renderer: RendererConstructor
}) {
  const impl = useRef<Renderer>()
  const frame = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const { width = 0, height = 0 } = useResizeObserver<HTMLDivElement>({ ref: frame })

  useEffect(() => {
    if (canvas.current) {
      impl.current = new renderer(canvas.current)
    }
    return () => {
      impl.current?.stopAnimating()
      impl.current = undefined
    }
  }, [renderer])

  useEffect(() => {
    if (width && height && impl.current) {
      impl.current.resize({ width, height })
      impl.current.startAnimating()
    }
  }, [height, width])

  return (
    <div className={classNames(styles.frame, className)} ref={frame}>
      <canvas className={styles.canvas} ref={canvas} />
    </div>
  )
}

export abstract class Renderer {
  private animationRequest: number | null = null

  protected readonly renderer: WebGLRenderer

  get canvas(): HTMLCanvasElement {
    return this.renderer.domElement
  }

  get size() {
    const canvas = this.renderer.domElement
    return { width: canvas.width, height: canvas.height }
  }

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true })
  }

  resize({ width, height }: { width: number; height: number }) {
    this.renderer.setSize(width, height)
  }

  abstract renderFrame(): void

  startAnimating = () => {
    this.stopAnimating()
    this.loop()
  }

  private loop() {
    this.animationRequest = requestAnimationFrame(() => {
      this.renderFrame()
      this.loop()
    })
  }

  stopAnimating = () => {
    if (this.animationRequest !== null) {
      cancelAnimationFrame(this.animationRequest)
      this.animationRequest = null
    }
  }
}

export function withThree(Renderer: RendererConstructor) {
  return function ThreeRenderer(props: Omit<Parameters<typeof Three>[0], "renderer">) {
    return <Three {...props} renderer={Renderer} />
  }
}
