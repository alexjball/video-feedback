import { Versions } from "../../utils"
import * as v0 from "./v0"
import * as v1 from "./v1"
import * as v2 from "./v2"
export * from "./v2"

export const JsonStateVersions = new Versions(v0.JsonState).add(v1.upgradeJson).add(v2.upgradeJson)
