import { Quaternion, Vector2, Vector3, Vector4 } from "three"
import { State } from "./model"
import { cloneDeepWith } from "lodash"

export type JsonState = any

/** Converts simulation state to a JSON-serializable format */
export function deflate(s: State): JsonState {
  return cloneDeepWith(s, deflater)
}

/** Converts a previously-deflated JSON object into simulation state. */
export function inflate(json: JsonState): State {
  return cloneDeepWith(json, inflater)
}

/** Serialized classes included in the model state */
const jsonTypes: Record<string, { new (): any }> = {
  Quaternion: Quaternion,
  Vector2: Vector2,
  Vector3: Vector3,
  Vector4: Vector4
}

const labelsByCtors = new Map()
    .set(Quaternion, "Q")
    .set(Vector2, "V2")
    .set(Vector3, "V3")
    .set(Vector4, "V4"),
  ctorsByLabels = new Map()
labelsByCtors.forEach((label, ctor) => ctorsByLabels.set(label, ctor))

function deflater(value: any) {
  const ctor = value?.constructor
  if (ctor && labelsByCtors.has(ctor)) {
    return {
      ...value,
      __t: labelsByCtors.get(ctor)
    }
  }
}

function inflater(value: any) {
  if (ctorsByLabels.has(value?.["__t"])) {
    const { __t: name, ...v } = value,
      Class = ctorsByLabels.get(name)
    return Object.assign(new Class(), v)
  }
}
