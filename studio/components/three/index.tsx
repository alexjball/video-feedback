import { useEffect, useRef } from "react"
import {
  Scene,
  BoxGeometry,
  PerspectiveCamera,
  WebGLRenderer,
  MeshBasicMaterial,
  Mesh
} from "three"
import styles from "./three.module.css"
import useResizeObserver from "use-resize-observer"
import classNames from "classnames"

export function Three({ className }: { className?: string }) {
  const demo = useRef<ThreeDemo>()
  const frame = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const { width = 0, height = 0 } = useResizeObserver<HTMLDivElement>({ ref: frame })

  useEffect(() => {
    if (!demo.current) {
      demo.current = new ThreeDemo({ canvas: canvas.current! })
    }
    if (width && height) {
      console.log(width, height)
      demo.current.setSize(width, height)
      demo.current.startAnimation()
    }
    return () => {
      demo.current?.stopAnimation()
    }
  }, [width, height])

  return (
    <div className={classNames(styles.frame, className)} ref={frame}>
      <canvas className={styles.canvas} ref={canvas} />
    </div>
  )
}

class ThreeDemo {
  private animationRequest: number | null = null
  private renderer: WebGLRenderer
  private scene

  get canvasElement(): HTMLCanvasElement {
    return this.renderer.domElement
  }

  get size() {
    const canvas = this.renderer.domElement
    return { width: canvas.width, height: canvas.height }
  }

  constructor({ canvas }: { canvas: HTMLCanvasElement }) {
    this.renderer = new WebGLRenderer({ canvas })
    this.scene = this.createScene()
  }

  setSize(width: number, height: number) {
    this.renderer.setSize(width, height)
    this.scene.camera.aspect = width / height
    this.scene.camera.updateProjectionMatrix()
  }

  private createScene() {
    const { width, height } = this.size
    const camera = new PerspectiveCamera(75, width / height, 0.1, 1000)
    const scene = new Scene()
    const geometry = new BoxGeometry()
    const material = new MeshBasicMaterial({ color: 0x00ff00 })
    const cube = new Mesh(geometry, material)
    scene.add(cube)

    camera.position.z = 5

    return {
      scene,
      geometry,
      material,
      cube,
      camera
    }
  }

  private animate = () => {
    this.startAnimation()

    const { scene, cube, camera } = this.scene

    cube.rotation.x += 0.01
    cube.rotation.y += 0.01

    this.renderer.render(scene, camera)
  }

  startAnimation = () => {
    this.animationRequest = requestAnimationFrame(this.animate)
  }

  stopAnimation = () => {
    if (this.animationRequest !== null) {
      cancelAnimationFrame(this.animationRequest)
      this.animationRequest = null
    }
  }
}
