import { Quaternion, Vector2, Vector3, Vector4 } from "three"
import { State } from "./model"

/** Serialized classes included in the model state */
const jsonTypes: Record<string, { new (): any }> = {
  Quaternion: Quaternion,
  Vector2: Vector2,
  Vector3: Vector3,
  Vector4: Vector4
}

/** Initializes class instance values */
function threeReviver(key: string, value: any) {
  if (value?.["__type"] in jsonTypes) {
    const { __type: name, ...v } = value,
      Class = jsonTypes[name]
    return Object.assign(new Class(), v)
  }
  return value
}

/** Serializes class instance values */
function threeReplacer(key: string, value: any) {
  const name = value?.constructor?.name
  if (name in jsonTypes) {
    return {
      ...value,
      __type: name
    }
  }
  return value
}

export function stringify(s: State, space?: number): string {
  return JSON.stringify(s, threeReplacer, space)
}

export function parse(s: string): State {
  return JSON.parse(s, threeReviver)
}
