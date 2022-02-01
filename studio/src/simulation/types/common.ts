import { Array, InstanceOf, Literal as L, Number, Record as R, Static, Union } from "runtypes"
import * as three from "three"

export type Resolution = Static<typeof Resolution>
export type Coords = Static<typeof Coords>
export type Pointer = Static<typeof Pointer>
export type Gesture = Static<typeof Gesture>

export const Resolution = R({ width: Number, height: Number })
export const Vector3 = InstanceOf(three.Vector3)
export const Quaternion = InstanceOf(three.Quaternion)
export const Coords = R({
  position: Vector3,
  quaternion: Quaternion,
  scale: Vector3
})
export const Pointer = R({ id: Number, x: Number, y: Number })
export const Gesture = R({ type: Union(L("primary"), L("alternate")), pointers: Array(Pointer) })

export const JsonVec3 = R({ __t: L("V3"), x: Number, y: Number, z: Number })
export const JsonQuat = R({ __t: L("Q"), _x: Number, _y: Number, _z: Number, _w: Number })
export const JsonCoords = R({
  position: JsonVec3,
  quaternion: JsonQuat,
  scale: JsonVec3
})
