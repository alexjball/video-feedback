import { Box3, OrthographicCamera, Vector3 } from "three"

/**
 * Creates a 1x1 orthographic camera in the xy plane, centered on the origin,
 * looking at -z, and viewing +/- 100z
 */
export function unitOrthoCamera() {
  return new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -100, 100)
}

export function contain({
  camera,
  aspect,
  bb,
  maxPadding
}: {
  camera: OrthographicCamera
  aspect: number
  bb: Box3
  maxPadding: number
}) {
  let dx, dy
  const bbW = bb.max.x - bb.min.x,
    bbH = bb.max.y - bb.min.y,
    bbAspect = bbW / bbH,
    center = bb.getCenter(new Vector3())

  if (bbAspect > aspect) {
    // Content is scaled to fit viewport width
    dx = pad(bbW * 0.5, maxPadding)
    dy = dx / aspect
  } else {
    // Content is scaled to fit viewport height
    dy = pad(bbH * 0.5, maxPadding)
    dx = dy * aspect
  }

  camera.top = center.y + dy
  camera.bottom = center.y - dy
  camera.right = center.x + dx
  camera.left = center.x - dx
  camera.updateProjectionMatrix()
}

function pad(d: number, maxPadding: number) {
  return Math.ceil(d / maxPadding) * maxPadding
}
