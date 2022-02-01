import { Versions } from "../../utils"
import * as v0 from "./v0"
import * as v1 from "./v1"
export * from "./v1"

export const JsonStateVersions: Versions<v1.JsonState> = new Versions(v0.JsonState).add(
  v1.upgradeJson
)
