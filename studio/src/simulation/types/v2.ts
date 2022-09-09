import { Literal as L, Number, Runtype, Static } from "runtypes"
import { createUpgrade } from "../../utils"
import { Coords, JsonCoords } from "./common"
import * as prev from "./v1"

export type State = Static<typeof State>
export type JsonState = Static<typeof JsonState>
export const State = defineState(Coords)
export const JsonState = defineState(JsonCoords)

export const upgradeJson = createUpgrade<prev.JsonState, JsonState>(
  JsonState,
  ({ feedback, ...rest }: prev.JsonState) => {
    return {
      ...rest,
      feedback: { ...feedback, seedOpacity: 0 },
      version: 2
    }
  }
)

export function defineState<C extends Runtype>(Coords: C) {
  const base = prev.defineState(Coords)
  return base
    .omit("feedback")
    .omit("version")
    .extend({
      version: L(2),
      feedback: base.fields.feedback.extend({ seedOpacity: Number })
    })
}
