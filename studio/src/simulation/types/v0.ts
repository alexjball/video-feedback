import {
  Boolean,
  Null,
  Number,
  Optional,
  Record as R,
  Runtype,
  Static,
  String,
  Union
} from "runtypes"
import { Coords, Gesture, JsonCoords, Resolution } from "./common"

export type State = Static<typeof State>
export type JsonState = Static<typeof JsonState>
export const State = defineState(Coords)
export const JsonState = defineState(JsonCoords)

export function defineState<C extends Runtype>(Coords: C) {
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
      coords: Coords
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
