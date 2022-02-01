import { version } from "prettier"
import { initialState, State, deflate, inflate, inflateUnchecked, deflateUnchecked } from "../model"
import * as v0 from "./v0"

describe("types", () => {
  it("accepts valid state", () => {
    const result = State.validate(initialState)
    expect(result.success).toBeTruthy()
  })
  /**
   * Prefer to reject. rejecting extra is good for checking user input.
   *
   * https://github.com/pelotom/runtypes/issues/41
   * https://github.com/pelotom/runtypes/blob/master/src/types/record.ts#L126
   */
  it("accepts extra state", () => {
    const result: any = State.validate({ ...initialState, notARealField: true })
    expect(result.success).toBeTruthy()
  })
  it("rejects invalid state", () => {
    const result: any = State.validate({ ...initialState, background: "this should be an object" })
    expect(result.success).toBeFalsy()
    expect(result.message).not.toHaveLength(0)
  })
  it("rejects missing state", () => {
    const result: any = State.validate({ ...initialState, background: undefined })
    expect(result.success).toBeFalsy()
    expect(result.message).not.toHaveLength(0)
  })
  test("deflate", () => {
    expect(() => deflate(initialState)).not.toThrow()
    const { portal: _, ...invalid } = initialState
    expect(() => deflate(invalid as any)).toThrow()
    expect(() => deflateUnchecked(invalid as any)).not.toThrow()
  })
  it("inflate", () => {
    const deflated = deflate(initialState)
    const {
      version,
      portal: { nTiles, ...portal },
      ...rest
    } = deflated
    const old: v0.JsonState = { ...rest, portal }

    expect(() => inflate(deflated)).not.toThrow()

    const upgraded = inflate(old)
    expect(upgraded.version).toBe(initialState.version)
    expect(upgraded.portal.nTiles).toBe(1)

    const invalid = { ...old, background: "invalid" }

    expect(() => inflate(invalid)).toThrow()
    expect(() => inflateUnchecked(invalid as any)).not.toThrow()
  })
})
