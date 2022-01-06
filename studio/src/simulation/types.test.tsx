import { initialState } from "./model"
import { State } from "./types"

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
})
