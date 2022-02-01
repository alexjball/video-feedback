import { cloneDeepWith } from "lodash"
import { Quaternion, Vector2, Vector3, Vector4 } from "three"
import { JsonState, State, JsonStateVersions } from "./state"

/**
 * Converts a previously-deflated JSON object into simulation state, validating
 * and upgrading to the latest version.
 */
export function inflate(json: any): State {
  const current = JsonStateVersions.upgrade(json),
    state = State.check(inflateUnchecked(current))
  return state
}

/** Converts simulation state to a validated JSON-serializable format */
export function deflate(s: State) {
  return JsonState.check(deflateUnchecked(s))
}

/**
 * Converts simulation state to a JSON-serializable format without validating.
 */
export function deflateUnchecked(s: State) {
  return cloneDeepWith(s, deflater)
}

/** Converts a previously-deflated JSON object into simulation state without
 * upgrading or validating. */
export function inflateUnchecked(json: JsonState): State {
  return cloneDeepWith(json, inflater)
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
