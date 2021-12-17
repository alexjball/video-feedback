import {
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  Texture,
  WebGLRenderer,
  WebGLRenderTarget
} from "three"
import { unitOrthoCamera } from "../camera"
import { Binder } from "../utils"
import Destination from "./destination"
import { copyCoords, State } from "./model"

export class Simulation {
  readonly scene: Scene
  readonly feedback: Feedback
  readonly viewer: OrthographicCamera
  readonly border: Mesh<PlaneGeometry, MeshBasicMaterial>
  readonly background: Mesh<PlaneGeometry, MeshBasicMaterial>

  constructor() {
    const o = this.createScene()
    this.scene = o.scene
    this.viewer = o.viewer
    this.border = o.border
    this.background = o.background

    this.feedback = new Feedback(this)
  }

  render(state: State, renderer: WebGLRenderer) {
    // Bind state
    this.binder.apply(state)
    this.feedback.binder.apply(state)

    // Render feedback color and depth frames
    this.feedback.render(renderer)

    // Render viewer to the canvas
    renderer.setRenderTarget(null)
    renderer.render(this.scene, this.viewer)
  }

  dispose() {
    this.feedback.dispose()
  }

  private createScene() {
    const scene = new Scene()

    const background = new Mesh(
      new PlaneGeometry(500, 500),
      new MeshBasicMaterial({ color: "#00ff00" })
    )
    background.position.set(0, 0, -10)
    scene.add(background)

    const border = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ color: "#ffffff" }))
    scene.add(border)

    const viewer = unitOrthoCamera()
    scene.add(viewer)

    return { scene, background, viewer, border }
  }

  private binder = new Binder<State>()
    .add(
      s => s.viewer.coords,
      v => copyCoords(v, this.viewer)
    )
    .add(
      s => s.border.coords,
      v => copyCoords(v, this.border)
    )
    .add(
      s => s.border.color,
      v => this.border.material.color.set(v)
    )
    .add(
      s => s.background.color,
      v => this.background.material.color.set(v)
    )
}

export class Feedback {
  private view: Simulation

  /** Maps destination regions to source regions.  */
  private spacemap = new Object3D()

  /**
   * The current view of the feedback. It is updated at the end of `iterate`.
   */
  private portal = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: new Texture() }))

  /**
   * The source region. In general, the source resolution is different than the destination.
   */
  private sourceFrame = this.createTarget()

  /**
   * The destination region frames for the delay line.
   */
  private destinationFrames = [this.createTarget()]
  private destination = new Destination()
  private currentFrameIndex = 0

  get currentFrame() {
    return this.destinationFrames[this.currentFrameIndex]
  }

  private camera = unitOrthoCamera()

  constructor(view: Simulation) {
    this.view = view
    this.view.scene.add(this.portal, this.spacemap)
    this.spacemap.add(this.camera)
  }

  readonly binder = new Binder<State>()
    .add(
      s => s.spacemap.coords,
      v => copyCoords(v, this.spacemap)
    )
    .add(
      s => s.portal.coords,
      v => {
        copyCoords(v, this.camera)
        copyCoords(v, this.portal)
      }
    )
    .add(
      s => ({
        mirrorX: s.spacemap.mirrorX,
        mirrorY: s.spacemap.mirrorY,
        colorGain: s.feedback.colorGain,
        colorCycle: s.feedback.colorCycle,
        invertColor: s.feedback.invertColor
      }),
      v => this.destination.updateUniforms(v)
    )
    .add(
      s => s.feedback.nFrames,
      v => this.setNumberFeedbackFrames(v)
    )
    .add(
      s => s.feedback.resolution,
      v => this.setSize(v.width, v.height)
    )

  dispose() {
    this.sourceFrame.dispose()
    this.destinationFrames.forEach(frame => frame.dispose())
    this.destination.dispose()
  }

  setNumberFeedbackFrames(n: number) {
    const keep = this.destinationFrames.slice(0, n),
      dispose = this.destinationFrames.slice(n),
      { width, height } = this.destinationFrames[0]
    dispose.forEach(f => f.dispose())

    this.destinationFrames = [
      ...keep,
      ...Array(n - keep.length)
        .fill(undefined)
        .map(() => this.createTarget(width, height))
    ]
    if (this.currentFrameIndex >= n) this.currentFrameIndex = 1
  }

  setSize(width: number, height: number) {
    this.sourceFrame.setSize(width, height)
    this.destinationFrames.forEach(frame => frame.setSize(width, height))
  }

  render(renderer: WebGLRenderer) {
    // Set up the camera to cover the feedback source region. Align the camera
    // with the bounding box of the portal geometry, then transform the camera
    // through the portal and spacemap.
    this.portal.geometry.computeBoundingBox()
    const bb = this.portal.geometry.boundingBox!

    this.camera.left = bb.min.x
    this.camera.right = bb.max.x
    this.camera.top = bb.max.y
    this.camera.bottom = bb.min.y

    // Move to the next frame in the delay line
    this.currentFrameIndex = (this.currentFrameIndex + 1) % this.destinationFrames.length
    const destinationFrame = this.currentFrame
    this.portal.material.map = destinationFrame.texture

    // Render the source frame
    renderer.setRenderTarget(this.sourceFrame)
    renderer.render(this.view.scene, this.camera)

    // Render the destination frame
    this.destination.render(renderer, destinationFrame, this.sourceFrame)
  }

  private createTarget(width = 0, height = 0) {
    return new WebGLRenderTarget(width, height, { format: RGBAFormat })
  }
}
