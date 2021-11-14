import { Store } from "redux"
import { Quaternion, Vector3 } from "three"
import { createModel, rotate, setBorderWidth, State, translate } from "./model"

describe("model", () => {
  let store: Store<State>
  beforeEach(() => (store = createModel()))

  it("Updates Border Width", () => {
    const s1 = store.getState()
    store.dispatch(setBorderWidth(3))
    const s2 = store.getState()

    expect(s1.borderWidth).not.toEqual(s2.borderWidth)
    expect(s1.spacemap).toBe(s2.spacemap)
  })

  it("Translates", () => {
    const dx = 5,
      dy = 5
    const s1 = store.getState(),
      p1 = s1.spacemap.position.clone()
    store.dispatch(translate({ dx, dy }))
    const s2 = store.getState()

    expect(s2.spacemap.position).toBeInstanceOf(Vector3)
    expect(s2.spacemap.position.equals(p1)).toBeFalsy()
    expect(s1.spacemap.position.equals(p1)).toBeTruthy()

    expect(s2.spacemap.scale).toBe(s1.spacemap.scale)
    expect(s2.spacemap.quaternion).toBe(s1.spacemap.quaternion)
    expect(s1.spacemap).not.toBe(s2.spacemap)
  })

  it("Rotates", () => {
    const distance = 100
    const s1 = store.getState(),
      q1 = s1.spacemap.quaternion.clone()
    store.dispatch(rotate(distance))
    const s2 = store.getState()

    expect(s2.spacemap.quaternion).toBeInstanceOf(Quaternion)
    expect(s2.spacemap.quaternion.equals(q1)).toBeFalsy()
    expect(s1.spacemap.quaternion.equals(q1)).toBeTruthy()

    expect(s2.spacemap.scale).toBe(s1.spacemap.scale)
    expect(s2.spacemap.position).toBe(s1.spacemap.position)
    expect(s1.spacemap).not.toBe(s2.spacemap)
  })
})
