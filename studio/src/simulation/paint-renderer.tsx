import { useEffect, useRef } from "react"
import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Texture,
  WebGLRenderer
} from "three"
import { usePaintCanvas } from "../paint-2d"

export function PaintRenderer(props: any) {
  const canvasRef = useRef()
  const paint = usePaintCanvas()
  useEffect(() => {
    if (paint && canvasRef.current) {
      renderPaintCanvasInGlContext(canvasRef.current, paint)
    }
  }, [paint])

  return <canvas {...props} ref={canvasRef} />
}

function renderPaintCanvasInGlContext(canvas: HTMLCanvasElement, paint: OffscreenCanvas) {
  const renderer = new WebGLRenderer({ canvas })
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)

  const scene = new Scene()
  const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

  const geometry = new BoxGeometry(1, 1, 1)
  const material = new MeshBasicMaterial({ map: new Texture() })
  const cube = new Mesh(geometry, material)
  scene.add(cube)

  camera.position.z = 5

  function animate() {
    requestAnimationFrame(animate)
    // TODO: only update if the paint area has been touched
    // TODO: transferToImageBitmap moves the memory, clearing the visible paint canvas. Use async createImageBitmap to copy the canvas.
    // TODO: decide whether to put the paint canvas in the worker or to keep it outside. Worker only makes sense if copy is more efficient. Since imagebitmaps are transferrable it's probably not much more efficient.
    // TODO: Could I use transferToImageBitmap to move per-frame contents of the 2d context to the gl context, where it is aggregated into the seed texture and displayed as part of the gl context? Sure but it's more work and couples the paint and pattern canvases. Defer the work on this, but keep it in mind.
    // TODO: performance of texImage2D vs createImageBitmap into textImage2D? If texImage2D is significantly faster, then I would need to put the 2d canvas in the offscreen renderer

    // Can't pass offscreen canvas to texImage2D, so I need to use transferToImageBitmap or createImageBitmap to copy to the offscreen pattern context.

    // material.map!.image = paint.transferToImageBitmap()
    // material.map!.needsUpdate = true
    renderer.render(scene, camera)
  }
  animate()
}
