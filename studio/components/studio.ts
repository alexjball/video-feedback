import * as three from "three"
import {
  Camera,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  Texture,
  Vector3,
  WebGLRenderTarget
} from "three"
import { Renderer, withThree } from "./three"

class Studio extends Renderer {
  private feedback
  private viewer
  private system

  constructor(canvas: HTMLCanvasElement) {
    super(canvas)
    this.system = this.createSystem()
    this.feedback = {
      scene: new Scene(),
      camera: (() => {
        const c = this.createCamera()
        c.position.x = 0.05
        return c
      })(),
      get target() {
        return this.targets[this.currentTarget]
      },
      targets: Array(2)
        .fill(undefined)
        .map(() => new WebGLRenderTarget(this.canvas.width, this.canvas.height)),
      currentTarget: 0,
      rotateTargets() {
        const latest = this.target
        this.currentTarget = (this.currentTarget + 1) % this.targets.length
        return latest
      }
    }
    this.viewer = {
      scene: new Scene(),
      camera: this.createCamera(),
      target: null
    }
  }

  createCamera = () => {
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 100)
    camera.position.set(0, 0, 10)
    return camera
  }

  override resize({ width, height }: any) {
    super.resize({ width, height })
    this.feedback.targets.forEach(frame => frame.setSize(width, height))
  }

  createSystem() {
    const system = new Group()

    const background = new three.Mesh(
      new PlaneGeometry(500, 500),
      new MeshBasicMaterial({ color: "#00ff00" })
    )
    background.position.set(0, 0, -10)
    system.add(background)

    const border = new Mesh(
      new PlaneGeometry(1.8, 1.8),
      new MeshBasicMaterial({ color: "#ffffff" })
    )
    border.position.set(0, 0, -1)
    system.add(border)

    const portal = new Mesh(
      new PlaneGeometry(1.5, 1.5),
      new MeshBasicMaterial({ map: new Texture() })
    )
    portal.position.set(0, 0, 0)
    system.add(portal)

    return { group: system, portal, border, background }
  }

  setState(state: {}) {
    // Spacemap is camera xy/rotation/scale
    // Portal is camera bounds
  }

  renderFrame() {
    this.renderScene(this.feedback)
    const portalView = this.feedback.rotateTargets()
    this.system.portal.material.map = portalView.texture
    this.renderScene(this.viewer)
  }

  renderScene(config: { scene: Scene; camera: Camera; target: WebGLRenderTarget | null }) {
    this.renderer.setRenderTarget(config.target)
    config.scene.add(this.system.group)
    this.renderer.render(config.scene, config.camera)
  }
}

export default withThree(Studio)

interface State {
  /** Specifies the mapping between source and destination pixels. */
  readonly spacemap: Object3D
  /** Specifies the region that will be fed back through the spacemap */
  readonly portal: Mesh<PlaneGeometry, MeshBasicMaterial>
}

/**
 * Renders visual feedback. Callers handle rendering and scenes. Scene should
 * not have position or anything.
 */
class Feedback implements State {
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
  private camera = new OrthographicCamera(-1, 1, 1, -1, 0, 100)
  private renderScene

  constructor(renderScene: (camera: OrthographicCamera, target: WebGLRenderTarget) => void) {
    this.spacemap.add(this.camera)
    this.portal.add(this.spacemap)
    this.renderScene = renderScene
  }

  setSize(width: number, height: number) {
    this.frames.forEach(frame => frame.setSize(width, height))
  }

  iterate() {
    // Determine Source region: transform portal in viewer by spacemap
    this.portal.geometry.computeBoundingBox()
    const bb = this.portal.geometry.boundingBox!

    this.camera.left = bb.min.x
    this.camera.right = bb.max.x
    this.camera.top = bb.max.y
    this.camera.bottom = bb.min.y

    this.portal.updateMatrixWorld()

    // Pop LRU frame, render the source region of the feedback scene to the frame using a render callback, which may cause the feedback to render its portal
    const lruFrame = (this.currentFrame + 1) % this.frames.length
    const target = this.frames[lruFrame]
    this.renderScene(this.camera, target)

    // Update the portal texture to the LRU frame
    this.portal.material.map = target.texture
    this.currentFrame = lruFrame
  }
}
