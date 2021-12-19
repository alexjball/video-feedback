import {
  Color,
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

const round = Math.round,
  max = Math.max

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
  private sourceFrame = new Frames()

  /**
   * The destination frame that is rendered into. This is swapped with the delay frames.
   */
  private destinationFrame = new Frames()

  /**
   * The frames that are displayed in order, creating a smooth delayed effect.
   */
  private delayFrames = [new Frames()]
  private destination = new Destination()
  private currentFrameIndex = 0

  get currentFrames() {
    return this.delayFrames[this.currentFrameIndex]
  }

  private camera = unitOrthoCamera()

  private debug = (() => {
    const view = new Mesh(
        new PlaneGeometry(0.25, 0.25),
        new MeshBasicMaterial({ map: new Texture() })
      ),
      camera = unitOrthoCamera()

    view.position.x = -0.375
    view.position.y = -0.375
    view.updateMatrixWorld()

    return { view, camera }
  })()

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
    .add(
      s => ({ border: s.border.color, background: s.background.color }),
      v => {
        this.delayFrames.forEach(frame => frame.markDirty())
      }
    )

  dispose() {
    this.sourceFrame.dispose()
    this.destinationFrame.dispose()
    this.delayFrames.forEach(frame => frame.dispose())
    this.destination.dispose()
  }

  setNumberFeedbackFrames(n: number) {
    const keep = this.delayFrames.slice(0, n),
      dispose = this.delayFrames.slice(n),
      { width, height } = this.delayFrames[0].color
    dispose.forEach(f => f.dispose())

    this.delayFrames = [
      ...keep,
      ...Array(n - keep.length)
        .fill(undefined)
        .map(() => new Frames(width, height))
    ]
    if (this.currentFrameIndex >= n) this.currentFrameIndex = 1
  }

  setSize(width: number, height: number) {
    this.sourceFrame.setSize(width, height)
    this.destinationFrame.setSize(width, height)
    this.delayFrames.forEach(frame => frame.setSize(width, height))
  }

  iterate(renderer: WebGLRenderer) {
    this.alignCamera()
    this.incrementFrame(renderer)
    this.renderDepth(renderer)
    this.renderColor(renderer)
    this.commitFrame()
  }

  /** Render debug info, call at the end of a frame so it's drawn on top */
  renderDebug(renderer: WebGLRenderer) {
    renderer.autoClear = false
    renderer.setRenderTarget(null)
    renderer.render(this.debug.view, this.debug.camera)
    renderer.autoClear = true
  }

  private alignCamera() {
    // Set up the camera to cover the feedback source region. Align the camera
    // with the bounding box of the portal geometry, then transform the camera
    // through the portal and spacemap.
    this.portal.geometry.computeBoundingBox()
    const bb = this.portal.geometry.boundingBox!

    this.camera.left = bb.min.x
    this.camera.right = bb.max.x
    this.camera.top = bb.max.y
    this.camera.bottom = bb.min.y
  }

  private renderColor(renderer: WebGLRenderer) {
    // Render the portal in color
    this.portal.material.map = this.currentFrames.color.texture

    // Render the source region
    this.renderSourceRegion(renderer, this.sourceFrame.color)

    // Render the destination region
    this.destination.render({
      renderer,
      destination: this.destinationFrame.color,
      depth: this.destinationFrame.depth,
      source: this.sourceFrame.color
    })
  }

  private renderDepth(renderer: WebGLRenderer) {
    // Record colors to restore after rendering
    const restore = {
      background: this.view.background.material.color.clone(),
      border: this.view.border.material.color.clone()
    }

    // Update scene to render using the appropriate depth colors
    this.portal.material.map = this.currentFrames.depth.texture
    this.view.background.material.color.set(depthColors.background)
    this.view.border.material.color.set(depthColors.border)

    this.renderSourceRegion(renderer, this.sourceFrame.depth)

    // Render the destination region
    this.destination.render({
      renderer,
      source: this.sourceFrame.depth,
      destination: this.destinationFrame.depth,
      prevDestination: this.currentFrames.depth,
      type: "depth"
    })

    // Restore original colors
    this.view.background.material.color.set(restore.background)
    this.view.border.material.color.set(restore.border)
  }

  private incrementFrame(renderer: WebGLRenderer) {
    this.currentFrameIndex = (this.currentFrameIndex + 1) % this.delayFrames.length
    // Copy the color target over to the destination buffer since the color rendering
    // doesn't need the previous destination in order to render.
    this.destinationFrame.color = this.currentFrames.color
    this.currentFrames.clearIfDirty(renderer)
  }

  /** Swap the render targets with the displayed delay frame. */
  private commitFrame() {
    const frame = this.currentFrames
    this.delayFrames[this.currentFrameIndex] = this.destinationFrame
    this.destinationFrame = frame
    this.portal.material.map = this.currentFrames.color.texture
    this.debug.view.material.map = this.currentFrames.depth.texture
  }

  private renderSourceRegion(renderer: WebGLRenderer, target: WebGLRenderTarget) {
    renderer.setRenderTarget(target)
    renderer.render(this.view.scene, this.camera)
  }
}

/**
 * RGB colors for parts of the scene.
 * MSB of r is the settled bit.
 * rest of r is the label.
 * g + b is the depth.
 */
const depthColors = {
  portal: encodeDepth(false, 0, 0),
  background: encodeDepth(true, 0, 1),
  border: encodeDepth(true, 0, 2)
}

function encodeDepth(settled: boolean, depth: number, label: number): Color {
  if (label < 0 || label > 127) throw Error("label must be between 0 and 127")
  if (depth < 0 || depth > 65535) throw Error("label must be between 0 and 65535")
  return new Color((label + (settled ? 128 : 0)) / 255, (depth >> 8) / 255, (depth & 255) / 255)
}

class Frames {
  color: WebGLRenderTarget
  depth: WebGLRenderTarget
  dirty = true
  depthDimension = 1024
  clearColor = {
    color: "#000000",
    depth: depthColors.portal
  }

  constructor(width = 0, height = 0) {
    const depth = this.depthSize(width, height)
    this.color = new WebGLRenderTarget(width, height, { format: RGBAFormat })
    this.depth = new WebGLRenderTarget(depth.width, depth.height, { format: RGBAFormat })
  }

  markDirty() {
    this.dirty = true
  }

  clearIfDirty(renderer: WebGLRenderer) {
    if (this.dirty) {
      this.clear(renderer)
    }
    this.dirty = false
  }

  dispose() {
    this.color.dispose()
    this.depth.dispose()
  }

  setSize(width: number, height: number) {
    const depth = this.depthSize(width, height)
    this.color.setSize(width, height)
    this.depth.setSize(depth.width, depth.height)
  }

  clear(renderer: WebGLRenderer, depth = true, color = false) {
    if (depth) {
      renderer.setClearColor(this.clearColor.depth)
      renderer.setRenderTarget(this.depth)
      renderer.clear()
    }
    if (color) {
      renderer.setClearColor(this.clearColor.color)
      renderer.setRenderTarget(this.color)
      renderer.clear()
    }
  }

  depthSize(width: number, height: number) {
    if (height == 0 || width === 0) return { width, height }

    const size = round(max(width, height)),
      aspect = width / height
    return aspect > 1
      ? {
          width: size,
          height: round(size / aspect)
        }
      : {
          width: round(size * aspect),
          height: size
        }
  }
}
