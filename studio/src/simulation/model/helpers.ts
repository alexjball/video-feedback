import { Vector3, Quaternion, Object3D, Matrix4, Vector2 } from "three"
import { Coords, Gesture } from "./types"

export const pi2 = 2 * Math.PI

export function createCoords(): Coords {
  return { position: new Vector3(), scale: new Vector3(), quaternion: new Quaternion() }
}
export function copyCoords(from: Coords, to: Coords = createCoords()): Coords {
  to.position.copy(from.position)
  to.quaternion.copy(from.quaternion)
  to.scale.copy(from.scale)
  return to
}

export function aspectRatio(coords: Coords) {
  return coords.scale.x / coords.scale.y
}

export class Object3DCoords extends Object3D {
  from(coords: Coords) {
    copyCoords(coords, this)
    this.updateMatrixWorld()
    return this
  }

  to(coords: Coords) {
    copyCoords(this, coords)
  }
}

export const o = new Object3DCoords()
export const m = new Matrix4()

export function assign<T>(from: T, to: T, k: (keyof T)[]) {
  k.forEach(k => {
    if (k === "coords") {
      copyCoords(from[k] as any, to[k] as any)
    } else {
      to[k] = from[k]
    }
  })
}

export function getCenter({ pointers: g }: Gesture) {
  let x = 0,
    y = 0
  for (const p of g) {
    x += p.x / g.length
    y += p.y / g.length
  }
  return { x, y }
}

export function getAngle({ pointers: p }: Gesture) {
  if (p.length !== 2) throw Error("Angle is only defined for two-point gestures")
  const from = new Vector2(p[0].x, p[0].y),
    to = new Vector2(p[1].x, p[1].y)
  return to.sub(from).angle()
}

export function getLength({ pointers: p }: Gesture) {
  if (p.length !== 2) throw Error("Length is only defined for two-point gestures")
  const from = new Vector2(p[0].x, p[0].y),
    to = new Vector2(p[1].x, p[1].y)
  return to.sub(from).length()
}

export const getPointer = ({ pointers: g }: Gesture, id: number) => g.find(p => p.id === id)
