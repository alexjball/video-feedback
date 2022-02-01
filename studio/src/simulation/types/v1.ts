import { Literal as L, Number, Runtype, Static } from "runtypes"
import { createUpgrade } from "../../utils"
import { Coords, JsonCoords } from "./common"
import * as prev from "./v0"

export type State = Static<typeof State>
export type JsonState = Static<typeof JsonState>
export const State = defineState(Coords)
export const JsonState = defineState(JsonCoords)

export const upgradeJson = createUpgrade<prev.JsonState, JsonState>(
  JsonState,
  ({ portal, ...rest }: prev.JsonState) => {
    return {
      ...rest,
      portal: { ...portal, nTiles: 1 },
      version: 1
    }
  }
)

function defineState<C extends Runtype>(Coords: C) {
  const base = prev.defineState(Coords)
  return base.omit("portal").extend({
    version: L(1),
    portal: base.fields.portal.extend({ nTiles: Number })
  })
}
