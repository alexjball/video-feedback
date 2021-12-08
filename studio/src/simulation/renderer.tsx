import { useCallback } from "react"
import {
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  PlaneGeometry,
  RGBFormat,
  Scene,
  Texture,
  WebGLRenderer,
  WebGLRenderTarget
} from "three"
import { unitOrthoCamera } from "../camera"
import { useAppStore } from "../hooks"
import { useStats, StatsJs } from "../stats"
import type { AppStore } from "../store"
import * as three from "../three"
import Binder from "../binder"
import { copyCoords, updatePortal, setViewer, State } from "./model"
import { shallowEqual } from "react-redux"
import Destination from "./destination"

export function useRenderer() {
  const { stats } = useStats()
  const store = useAppStore()
  const createRenderer = useCallback(() => new Renderer(store, stats), [stats, store])
  const renderer = three.useRenderer(createRenderer)
  return renderer
}

class Renderer extends three.WebGlRenderer {
  private view: SimulationView
  private stats?: StatsJs

  constructor(store: AppStore, stats?: StatsJs) {
    super(store)
    this.stats = stats
    this.view = new SimulationView()
  }

  override renderFrame() {
    this.stats?.begin()
    this.view.draw(this.state.simulation, this.renderer)
    this.stats?.end()
  }

  override setSize(width: number, height: number) {
    super.setSize(width, height)
    this.store.dispatch(setViewer({ width, height }))
    this.store.dispatch(updatePortal({ height }))
  }

  override dispose() {
    super.dispose()
    this.view.dispose()
  }
}

class SimulationView {
  readonly scene: Scene
  readonly feedback: FeedbackView
  readonly viewer: OrthographicCamera
  readonly border: Mesh<PlaneGeometry, MeshBasicMaterial>
  readonly background: Mesh<PlaneGeometry, MeshBasicMaterial>

  constructor() {
    const o = this.initObjects()
    this.scene = o.scene
    this.feedback = o.feedback
    this.viewer = o.viewer
    this.border = o.border
    this.background = o.background
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
    scene.add(border)

    const feedback = new FeedbackView(scene)

    const viewer = unitOrthoCamera()
    scene.add(viewer)

    return { scene, background, feedback, viewer, border }
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

  draw(state: State, renderer: WebGLRenderer) {
    this.binder.apply(state)
    this.feedback.binder.apply(state)
    this.feedback.iterate(renderer, this.scene)

    renderer.setRenderTarget(null)
    renderer.render(this.scene, this.viewer)
    // TODO: Render debug scene
  }

  dispose() {
    this.feedback.dispose()
  }
}

/**
 * Renders visual feedback. Callers handle rendering and scenes. Scene should
 * not have position or anything.
 */
class FeedbackView {
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

  private currentFrame = 0
  private camera

  constructor(scene: Scene) {
    this.camera = unitOrthoCamera()
    this.spacemap.add(this.camera)

    scene.add(this.portal)
    scene.add(this.spacemap)
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
      v => this.destination.updateUniforms(v),
      shallowEqual
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
    if (this.currentFrame >= n) this.currentFrame = 1
  }

  setSize(width: number, height: number) {
    this.sourceFrame.setSize(width, height)
    this.destinationFrames.forEach(frame => frame.setSize(width, height))
  }

  iterate(renderer: WebGLRenderer, scene: Scene) {
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
    this.currentFrame = (this.currentFrame + 1) % this.destinationFrames.length
    const destinationFrame = this.destinationFrames[this.currentFrame]
    this.portal.material.map = destinationFrame.texture

    // Render the source frame
    renderer.setRenderTarget(this.sourceFrame)
    renderer.render(scene, this.camera)

    // Render the destination frame
    this.destination.render(renderer, destinationFrame, this.sourceFrame)
  }

  private createTarget(width = 0, height = 0) {
    return new WebGLRenderTarget(width, height, { format: RGBFormat })
  }
}
