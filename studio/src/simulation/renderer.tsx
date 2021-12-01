import { useCallback } from "react"
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
import { unitOrthoCamera } from "../camera"
import { useAppStore } from "../hooks"
import { useStats, StatsJs } from "../stats"
import type { AppStore } from "../store"
import * as three from "../three"
import Binder from "../binder"
import { copyCoords, setSize, State } from "./model"

export function useRenderer() {
  const { stats } = useStats()
  const store = useAppStore()
  const createRenderer = useCallback(() => new Renderer(store, stats), [stats, store])
  const renderer = three.useRenderer(createRenderer)
  return renderer
}

type Render = (scene: Scene, camera: OrthographicCamera, target: WebGLRenderTarget | null) => void
type RenderScene = (camera: OrthographicCamera, target: WebGLRenderTarget) => void

class Renderer extends three.WebGlRenderer {
  private view: SimulationView
  private stats?: StatsJs

  constructor(store: AppStore, stats?: StatsJs) {
    super(store)
    this.stats = stats
    this.view = new SimulationView()
  }

  get state(): State {
    return this.store.getState().simulation
  }

  override renderFrame() {
    this.stats?.begin()
    this.view.draw(this.state, this.renderScene)
    this.stats?.end()
  }

  override setSize(width: number, height: number) {
    super.setSize(width, height)
    this.store.dispatch(setSize({ width, height }))
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
  readonly border: Mesh

  constructor() {
    const o = this.initObjects()
    this.scene = o.scene
    this.feedback = o.feedback
    this.viewer = o.viewer
    this.border = o.border
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

    return { scene, feedback, viewer, border }
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
      s => s.viewport,
      v => {
        this.feedback.setSize(v.width, v.height)
      }
    )

  draw(state: State, render: Render) {
    this.binder.apply(state)
    this.feedback.binder.apply(state)
    this.feedback.iterate((camera, target) => render(this.scene, camera, target))
    render(this.scene, this.viewer, null)
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

  private frames = Array(2)
    .fill(undefined)
    .map(() => new WebGLRenderTarget(0, 0))
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
