import {
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  RGBAFormat,
  Texture,
  WebGLRenderer,
  WebGLRenderTarget
} from "three"
import { unitOrthoCamera } from "../camera"
import { Binder } from "../utils"
import Destination from "./destination"
import { copyCoords, State } from "./model"
import type Simulation from "./simulation"

export default class Feedback {
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
  private sourceFrame = createFrames()

  /**
   * The destination region frames for the delay line.
   */
  private destinationFrames = [createFrames()]
  private destination = new Destination()
  private currentFrameIndex = 0

  get currentFrames() {
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
      { width, height } = this.destinationFrames[0].color
    dispose.forEach(f => f.dispose())

    this.destinationFrames = [
      ...keep,
      ...Array(n - keep.length)
        .fill(undefined)
        .map(() => createFrames(width, height))
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
    const destinationFrame = this.currentFrames

    // Render the color target
    this.renderDepth(renderer, destinationFrame)
    // Render color second so the color target is bound to the portal on return
    this.renderColor(renderer, destinationFrame)
  }

  renderDepth(renderer: WebGLRenderer, destinationFrame: Frames) {
    // record colors to restore after rendering
    const restore = {
      background: this.view.background.material.color.clone(),
      border: this.view.border.material.color.clone()
    }

    // Update scene to render using the appropriate depth colors
    this.portal.material.map = destinationFrame.depth.texture
    this.view.background.material.color.set(depthColors.background)
    this.view.border.material.color.set(depthColors.border)

    // Render the source region
    renderer.setRenderTarget(this.sourceFrame.depth)
    renderer.render(this.view.scene, this.camera)

    // Render the destination region
    // TODO: Need to pass in the target to apply
    // TODO: Figure out how to compute the settled bit
    // TODO: Add a buffer target into which to render the destination, then
    // swap it with the current destination target.
    this.destination.render(renderer, destinationFrame.depth, this.sourceFrame.depth)

    // Restore original colors
    this.view.background.material.color.set(restore.background)
    this.view.border.material.color.set(restore.border)
  }

  renderColor(renderer: WebGLRenderer, destinationFrame: Frames) {
    this.portal.material.map = destinationFrame.color.texture

    // Render the source region
    renderer.setRenderTarget(this.sourceFrame.color)
    renderer.render(this.view.scene, this.camera)

    // Render the destination region
    this.destination.render(renderer, destinationFrame.color, this.sourceFrame.color)
  }
}

const depthColors = {
  background: "#ffffff",
  border: "#ffffff"
}

interface Frames {
  color: WebGLRenderTarget
  depth: WebGLRenderTarget
  dispose: () => void
  setSize: (width: number, height: number) => void
}

function createFrames(width = 0, height = 0): Frames {
  const depth = depthSize(width, height)
  return {
    color: new WebGLRenderTarget(width, height, { format: RGBAFormat }),
    depth: new WebGLRenderTarget(depth.width, depth.height, { format: RGBAFormat }),
    dispose() {
      this.color.dispose()
      this.depth.dispose()
    },
    setSize(width: number, height: number) {
      const depth = depthSize(width, height)
      this.color.setSize(width, height)
      this.depth.setSize(depth.width, depth.height)
    }
  }
}

function depthSize(width: number, height: number) {
  if (height == 0 || width === 0) return { width, height }

  const size = 512,
    aspect = width / height
  return aspect > 1
    ? {
        width: size,
        height: size / aspect
      }
    : {
        width: size * aspect,
        height: size
      }
}
