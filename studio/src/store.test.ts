import { Quaternion, Vector3 } from "three"
import { toggleShow } from "./stats"
import { AppStore, createStore } from "./store"
import { rotate, setBorderWidth, translate } from "./studio/model"

let store: AppStore
beforeEach(() => (store = createStore()))

describe("model", () => {
  const getState = () => store.getState().studio

  it("Updates Border Width", () => {
    const s1 = getState()
    store.dispatch(setBorderWidth(3))
    const s2 = getState()

    expect(s1.borderWidth).not.toEqual(s2.borderWidth)
    expect(s1.spacemap).toBe(s2.spacemap)
  })

  it("Translates", () => {
    const dx = 5,
      dy = 5
    const s1 = getState(),
      p1 = s1.spacemap.position.clone()
    store.dispatch(translate({ dx, dy }))
    const s2 = getState()

    expect(s2.spacemap.position).toBeInstanceOf(Vector3)
    expect(s2.spacemap.position.equals(p1)).toBeFalsy()
    expect(s1.spacemap.position.equals(p1)).toBeTruthy()

    expect(s2.spacemap.scale).toBe(s1.spacemap.scale)
    expect(s2.spacemap.quaternion).toBe(s1.spacemap.quaternion)
    expect(s1.spacemap).not.toBe(s2.spacemap)
  })

  it("Rotates", () => {
    const distance = 100
    const s1 = getState(),
      q1 = s1.spacemap.quaternion.clone()
    store.dispatch(rotate(distance))
    const s2 = getState()

    expect(s2.spacemap.quaternion).toBeInstanceOf(Quaternion)
    expect(s2.spacemap.quaternion.equals(q1)).toBeFalsy()
    expect(s1.spacemap.quaternion.equals(q1)).toBeTruthy()

    expect(s2.spacemap.scale).toBe(s1.spacemap.scale)
    expect(s2.spacemap.position).toBe(s1.spacemap.position)
    expect(s1.spacemap).not.toBe(s2.spacemap)
  })
})

describe("stats", () => {
  const getState = () => store.getState().stats
  it("toggles show", () => {
    expect(getState().show).toBeTruthy()
    store.dispatch(toggleShow())
    expect(getState().show).toBeFalsy()
  })
})
