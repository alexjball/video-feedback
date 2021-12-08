import { Quaternion, Vector3 } from "three"
import { toggleShow } from "./stats"
import { AppStore, createStore } from "./store"
import { rotate, setBorderWidth, drag, setViewer, center } from "./simulation/model"

let store: AppStore
beforeEach(() => {
  store = createStore()
  store.dispatch(setViewer({ width: 10, height: 10 }))
})

describe("model", () => {
  const getState = () => store.getState().simulation

  it("Updates Border Width", () => {
    const s1 = getState()
    store.dispatch(setBorderWidth(3))
    const s2 = getState()

    expect(s1.border.width).not.toEqual(s2.border.width)
    expect(s1.spacemap).toBe(s2.spacemap)
  })

  it("Drags", () => {
    const x = 0,
      y = 0,
      dx = 5,
      dy = 5
    const s1 = getState(),
      p1 = s1.spacemap.coords.position.clone()
    store.dispatch(drag({ x, y, end: false }))
    store.dispatch(drag({ x: x + dx, y: y + dy, end: true }))
    const s2 = getState()

    expect(s2.spacemap.coords.position).toBeInstanceOf(Vector3)
    expect(s2.spacemap.coords.position.equals(p1)).toBeFalsy()
    expect(s1.spacemap.coords.position.equals(p1)).toBeTruthy()

    expect(s2.spacemap.coords.scale).toBe(s1.spacemap.coords.scale)
    expect(s2.spacemap.coords.quaternion).toBe(s1.spacemap.coords.quaternion)
    expect(s1.spacemap).not.toBe(s2.spacemap)
  })

  it("Rotates", () => {
    const distance = 100
    const s1 = getState(),
      q1 = s1.spacemap.coords.quaternion.clone()
    store.dispatch(rotate({ dx: 0, dy: distance }))
    const s2 = getState()

    expect(s2.spacemap.coords.quaternion).toBeInstanceOf(Quaternion)
    expect(s2.spacemap.coords.quaternion.equals(q1)).toBeFalsy()
    expect(s1.spacemap.coords.quaternion.equals(q1)).toBeTruthy()

    expect(s2.spacemap.coords.scale).toBe(s1.spacemap.coords.scale)
    expect(s2.spacemap.coords.position).toBe(s1.spacemap.coords.position)
    expect(s1.spacemap).not.toBe(s2.spacemap)
  })

  it("Centers", () => {
    const distance = 100
    const s1 = getState(),
      q1 = s1.spacemap.coords.quaternion.clone()

    store.dispatch(rotate({ dx: 0, dy: distance }))
    const s2 = getState()
    expect(s2.spacemap.coords.quaternion.equals(q1)).toBeFalsy()

    store.dispatch(center())
    const s3 = getState()
    expect(s3.spacemap.coords.quaternion.equals(q1)).toBeTruthy()
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
