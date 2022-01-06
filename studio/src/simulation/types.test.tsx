import { initialState } from "./model"
import { State } from "./types"

describe("types", () => {
  it("accepts valid state", () => {
    const result = State.validate(initialState)
    expect(result.success).toBeTruthy()
  })
  it("rejects invalid state", () => {
    const result: any = State.validate({ ...initialState, background: "this should be an object" })
    expect(result.success).toBeFalsy()
    expect(result.message).not.toHaveLength(0)
  })
})
