import {
  Boolean,
  InstanceOf,
  Literal as L,
  Null,
  Number,
  Record as R,
  Runtype,
  Static,
  String,
  Union,
  Array,
  Optional
} from "runtypes"
import * as three from "three"

export type Resolution = Static<typeof Resolution>
export type Coords = Static<typeof Coords>
export type State = Static<typeof State>
export type JsonState = Static<typeof JsonState>
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
export const State = defineState(Coords)

export const JsonVec3 = R({ __t: L("V3"), x: Number, y: Number, z: Number })
export const JsonQuat = R({ __t: L("Q"), _x: Number, _y: Number, _z: Number, _w: Number })
export const JsonCoords = R({
  position: JsonVec3,
  quaternion: JsonQuat,
  scale: JsonVec3
})
export const JsonState = defineState(JsonCoords)

function defineState<C extends Runtype>(Coords: C) {
  return R({
    border: R({
      width: Number,
      coords: Coords,
      color: String
    }),
    background: R({
      color: String
    }),
    spacemap: R({
      coords: Coords,
      pixelsPerScale: Number,
      mirrorX: Boolean,
      mirrorY: Boolean
    }),
    feedback: R({
      nFrames: Number,
      invertColor: Boolean,
      fsPeriod: Number,
      fsAmplitude: Number,
      fsPhase: Number,
      fsPop: Number,
      fsColor1: String,
      fsColor2: String,
      colorCycle: Number,
      colorGain: Number,
      resolution: Resolution
    }),
    portal: R({
      coords: Coords,
      nTiles: Number
    }),
    viewer: R({
      coords: Coords
    }),
    viewport: Resolution,
    drag: R({
      start: Union(
        R({
          coords: Coords,
          x: Number,
          y: Number
        }),
        Null
      )
    }),
    gesture: R({
      start: Optional(
        R({
          g: Gesture,
          spacemap: Coords
        })
      ),
      previous: Optional(Gesture)
    }),
    preventStrobing: Boolean
  })
}
