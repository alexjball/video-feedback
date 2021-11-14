import { useCallback, useEffect } from "react"
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

export function useRenderer() {
  const store = useStore()
  const createRenderer = useCallback(canvas => new Renderer(canvas, store), [store])
  const renderer = three.useRenderer(createRenderer)
  return renderer
}

type Render = (scene: Scene, camera: OrthographicCamera, target: WebGLRenderTarget | null) => void
type RenderScene = (camera: OrthographicCamera, target: WebGLRenderTarget) => void

class Renderer extends three.BaseRenderer {
  private view: StudioView
  private store: Store<State>
  constructor(canvas: HTMLCanvasElement, store: Store) {
    super(canvas)
    this.store = store
    this.view = new StudioView()
  }

  override renderFrame() {
    this.view.draw(this.store.getState(), this.renderScene)
  }

  override setSize(width: number, height: number) {
    super.setSize(width, height)
    this.view.setSize(width, height)
  }

  override dispose() {
    this.view.dispose()
  }
}

class StudioView {
  readonly scene: Scene
  readonly feedback: Feedback
  readonly viewer: OrthographicCamera

  constructor() {
    const o = this.initObjects()
    this.scene = o.scene
    this.feedback = o.feedback
    this.viewer = o.viewer
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

  private binder = new Binder<State>()
    .add(
      s => s.borderWidth,
      borderWidth => {}
    )
    .add(
      s => s.spacemap.position,
      v => this.feedback.spacemap.position.copy(v)
    )
    .add(
      s => s.spacemap.scale,
      v => this.feedback.spacemap.scale.copy(v)
    )
    .add(
      s => s.spacemap.quaternion,
      v => this.feedback.spacemap.quaternion.copy(v)
    )

  draw(state: State, render: Render) {
    this.binder.apply(state)
    this.feedback.iterate((camera, target) => render(this.scene, camera, target))
    render(this.scene, this.viewer, null)
  }

  setSize(width: number, height: number) {
    this.feedback.setSize(width, height)
  }

  dispose() {
    this.feedback.dispose()
  }
}

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
