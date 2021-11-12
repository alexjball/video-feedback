import { useStore } from "react-redux"
import { Store } from "redux"
import {
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  Texture,
  WebGLRenderTarget
} from "three"
import * as three from "../three"
import { Binder, State } from "./model"

class StudioRenderer extends three.BaseRenderer {
  readonly scene: Scene
  readonly feedback: Feedback
  readonly viewer: OrthographicCamera
  readonly store: Store

  private binder: Binder<State>

  constructor(canvas: HTMLCanvasElement, store: Store) {
    super(canvas)
    this.store = store
    this.binder = this.createBinder()
    const o = this.initObjects()
    this.scene = o.scene
    this.feedback = o.feedback
    this.viewer = o.viewer
  }

  private createBinder = () =>
    new Binder<State>()
      .add(
        s => s.borderWidth,
        borderWidth => {}
      )
      .add(
        s => s.spacemap.position,
        position => this.feedback.spacemap.position.copy(position)
      )
      .add(
        s => s.spacemap.scale,
        scale => this.feedback.spacemap.scale.copy(scale)
      )

  override renderFrame() {
    // Update Three.js objects to match state
    this.binder.apply(this.store.getState())
    // this.scene.updateMatrixWorld()
    // Render the next feedback iteration
    this.feedback.iterate((camera, target) => this.renderScene(this.scene, camera, target))
    // Render the studio view
    this.renderScene(this.scene, this.viewer, null)
  }

  override setSize(width: number, height: number) {
    super.setSize(width, height)
    this.feedback.setSize(width, height)
  }

  override dispose() {
    this.feedback.dispose()
  }

  private initObjects() {
    const scene = new Scene()

    const background = new Mesh(
      new PlaneGeometry(500, 500),
      new MeshBasicMaterial({ color: "#00ff00" })
    )
    background.position.set(0, 0, -10)
    scene.add(background)

    const border = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ color: "#ffffff" }))
    border.scale.set(2.5, 2.5, 1)
    border.position.set(0, 0, -1)
    scene.add(border)

    const feedback = new Feedback()
    const { portal, spacemap } = feedback
    // spacemap.scale.set(2, 2, 1)
    portal.scale.set(2, 2, 1)
    portal.position.set(0, 0, 0)
    scene.add(portal)

    const viewer = unitOrthoCamera()
    viewer.position.set(0, 0, 10)
    viewer.scale.set(2, 2, 1)
    scene.add(viewer)

    return { scene, feedback, viewer }
  }
}

// class InputController {
//   private renderer
//   private translating = false
//   private rotating = false
//   private zooming = false

//   constructor(renderer: Renderer) {
//     this.renderer = renderer
//     this.renderer.addEventListener("startAnimating", this.start)
//     this.renderer.addEventListener("stopAnimating", this.stop)
//   }

//   private get canvas() {
//     return this.renderer.canvas
//   }

//   start = () => {
//     this.canvas.addEventListener("mousedown", this.mouse)
//     this.canvas.addEventListener("mousemove", this.mouse)
//     this.canvas.addEventListener("mouseup", this.mouse)
//     this.canvas.addEventListener("mouseout", this.stopInteractions)
//     this.canvas.addEventListener("wheel", this.wheel)
//     this.canvas.addEventListener("contextmenu", this.ignore)
//   }

//   stop = () => {
//     this.canvas.removeEventListener("mousedown", this.mouse)
//     this.canvas.removeEventListener("mousemove", this.mouse)
//     this.canvas.removeEventListener("mouseup", this.mouse)
//     this.canvas.removeEventListener("mouseout", this.stopInteractions)
//     this.canvas.removeEventListener("wheel", this.wheel)
//     this.canvas.removeEventListener("contextmenu", this.ignore)
//   }

//   stopInteractions = () => {
//     this.translating = false
//     this.rotating = false
//     this.zooming = false
//   }

//   ignore = (e: any) => e.preventDefault()

//   mouse = (e: MouseEvent) => {
//     e.preventDefault()

//     if (e.type === "mousedown") {
//       if (e.button === 0) this.translating = true
//       if (e.button === 2) this.rotating = true
//     } else if (e.type === "mouseup") {
//       if (e.button === 0) this.translating = false
//       if (e.button === 2) this.rotating = false
//     } else if (e.type === "mousemove") {
//       if (this.translating) {
//         const { movementX: dx, movementY: dy } = e,
//           pixelsPerUnit = new Vector2(-5e2, 5e2),
//           spacemap = this.renderer.system.feedback.spacemap
//         spacemap.position.x += dx / pixelsPerUnit.x
//         spacemap.position.y += dy / pixelsPerUnit.y
//       }
//       if (this.rotating) {
//         const { movementX: dx } = e,
//           pixelsPerDegree = -50,
//           spacemap = this.renderer.system.feedback.spacemap
//         spacemap.rotateZ(((dx / pixelsPerDegree) * Math.PI) / 180.0)
//       }
//     }
//   }

//   wheel = (e: WheelEvent) => {
//     const { deltaY: dZ } = e,
//       pixelsPerScale = 1e3,
//       spacemap = this.renderer.system.feedback.spacemap
//     spacemap.scale.x += dZ / pixelsPerScale
//     spacemap.scale.y += dZ / pixelsPerScale
//     console.log(dZ, pixelsPerScale, spacemap.scale)
//   }
// }

type RenderScene = (camera: OrthographicCamera, target: WebGLRenderTarget) => void

/**
 * Renders visual feedback. Callers handle rendering and scenes. Scene should
 * not have position or anything.
 */
class Feedback {
  /** Maps source regions to destination regions.  */
  readonly spacemap = new Object3D()

  /**
   * The current view of the feedback. It is updated at the end of `iterate`.
   */
  readonly portal = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: new Texture() }))

  private frames = Array(2)
    .fill(undefined)
    .map(() => new WebGLRenderTarget(0, 0))
  private currentFrame = 0
  private camera

  constructor() {
    this.camera = unitOrthoCamera()
    // this.camera.position.set(0, 0, 10)
    // this.camera.scale.set(2, 2, 1)

    this.spacemap.add(this.camera)
    this.portal.add(this.spacemap)
  }

  dispose() {
    this.frames.forEach(frame => frame.dispose())
  }

  setSize(width: number, height: number) {
    this.frames.forEach(frame => frame.setSize(width, height))
  }

  iterate(renderScene: RenderScene) {
    // Set up the camera to cover the feedback source region. Align the camera
    // with the bounding box of the portal geometry, then transform the camera
    // through the portal and spacemap.
    this.portal.geometry.computeBoundingBox()
    const bb = this.portal.geometry.boundingBox!

    this.camera.left = bb.min.x
    this.camera.right = bb.max.x
    this.camera.top = bb.max.y
    this.camera.bottom = bb.min.y

    // this.portal.updateMatrixWorld()

    // Pop LRU frame, render the source region of the feedback scene to the
    // frame using a render callback, which may cause the feedback to render its
    // portal
    const lruFrame = (this.currentFrame + 1) % this.frames.length
    const target = this.frames[lruFrame]
    renderScene(this.camera, target)

    // Update the portal to render the updated feedback frame
    this.portal.material.map = target.texture
    this.currentFrame = lruFrame
  }
}

/**
 * Creates a 1x1 orthographic camera in the xy plane, centered on the origin,
 * looking at -z, and viewing +/- 100z
 */
function unitOrthoCamera() {
  return new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -100, 100)
}

export function Studio(props: three.WrapperProps) {
  const store = useStore()
  const renderer = three.useRenderer(canvas => new StudioRenderer(canvas, store), [store])

  return <three.Three {...props} renderer={renderer} />
}
