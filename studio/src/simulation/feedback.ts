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
import DepthView from "./depth-view"
import Destination from "./destination"
import { copyCoords, State } from "./model"
import type Simulation from "./simulation"

export default class Feedback {
  readonly view: Simulation

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

  readonly debug = new DepthView(this)

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
        invertColor: s.feedback.invertColor,
        fsPeriod: s.feedback.fsPeriod,
        fsPhase: s.feedback.fsPhase,
        fsAmplitude: s.feedback.fsAmplitude,
        fsColor1: s.feedback.fsColor1,
        fsColor2: s.feedback.fsColor2,
        preventStrobing: s.preventStrobing,
        fsPop: s.feedback.fsPop
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

  markDirty({ color = false, depth = false }) {
    this.delayFrames.forEach(frame => frame.markDirty(color, depth))
  }

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
    this.debug.setDepthTarget(this.currentFrames.depth)
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
  if (depth < 0 || depth > 65535) throw Error("depth must be between 0 and 65535")
  return new Color((label + (settled ? 128 : 0)) / 255, (depth >> 8) / 255, (depth & 255) / 255)
}

class Frames {
  color: WebGLRenderTarget
  depth: WebGLRenderTarget
  dirty = { color: true, depth: true }
  depthDimension = 1024
  clearColor = {
    color: "#000000",
    depth: depthColors.portal
  }

  constructor(width = 0, height = 0) {
    this.color = new WebGLRenderTarget(width, height, { format: RGBAFormat })
    this.depth = new WebGLRenderTarget(width, height, { format: RGBAFormat })
  }

  markDirty(color = false, depth = false) {
    this.dirty = { color: this.dirty.color || color, depth: this.dirty.depth || depth }
  }

  clearIfDirty(renderer: WebGLRenderer) {
    if (this.dirty.depth) {
      renderer.setClearColor(this.clearColor.depth, 1)
      renderer.setRenderTarget(this.depth)
      renderer.clear()
    }
    if (this.dirty.color) {
      renderer.setClearColor(this.clearColor.color, 1)
      renderer.setRenderTarget(this.color)
      renderer.clear()
    }
    this.dirty = { color: false, depth: false }
  }

  dispose() {
    this.color.dispose()
    this.depth.dispose()
  }

  setSize(width: number, height: number) {
    this.color.setSize(width, height)
    this.depth.setSize(width, height)
    this.markDirty(true, true)
  }
}
