import {
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer
} from "three"
import { unitOrthoCamera } from "../camera"
import { Binder } from "../utils"
import Feedback from "./feedback"
import { copyCoords, State } from "./model"
import { Painter } from "./painter"

export default class Simulation {
  readonly scene: Scene
  readonly feedback: Feedback
  readonly viewer: OrthographicCamera
  readonly border: Mesh<PlaneGeometry, MeshBasicMaterial>
  readonly background: Mesh<PlaneGeometry, MeshBasicMaterial>

  constructor(seed: Painter) {
    const o = this.createScene()
    this.scene = o.scene
    this.viewer = o.viewer
    this.border = o.border
    this.background = o.background

    this.feedback = new Feedback(this, seed)
  }

  render(state: State, renderer: WebGLRenderer) {
    // Bind state
    this.binder.apply(state)
    this.feedback.binder.apply(state)

    // Render feedback color and depth frames
    this.feedback.iterate(renderer)

    // Render viewer to the canvas
    renderer.setRenderTarget(null)
    renderer.render(this.scene, this.viewer)

    this.feedback.debug.render(renderer)
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
