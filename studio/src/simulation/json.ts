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

function deflater(value: any) {
  const name = value?.constructor?.name
  if (name in jsonTypes) {
    return {
      ...value,
      __type: name
    }
  }
}

function inflater(value: any) {
  if (value?.["__type"] in jsonTypes) {
    const { __type: name, ...v } = value,
      Class = jsonTypes[name]
    return Object.assign(new Class(), v)
  }
}
