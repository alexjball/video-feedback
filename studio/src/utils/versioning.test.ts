import { Record, Static, Literal, Number } from "runtypes"
import { createUpgrade, Versions } from "./versioning"

const Base = Record({ nest: Record({ f: Number }) })
type Base = Static<typeof Base>

namespace V1 {
  export type T = Static<typeof T>
  export const T = Base.extend({
    version: Literal(1)
  })
  export const upgrade = createUpgrade<Base, T>(T, r => {
    return { ...r, version: 1 }
  })
}

namespace V2 {
  export type T = Static<typeof T>
  export const T = V1.T.omit("version", "nest").extend({
    version: Literal(2),
    nest: V1.T.fields.nest.extend({
      f2: Number
    })
  })
  export const upgrade = createUpgrade<V1.T, T>(T, v => {
    const { nest, ...rest } = v
    return {
      ...rest,
      nest: { ...nest, f2: 123 },
      version: 2
    }
  })
}

const versions: Versions<V2.T> = new Versions(Base).add(V1.upgrade).add(V2.upgrade)

describe("versioning", () => {
  it("upgrades from base", () => {
    const base: Base = { nest: { f: 2 } }
    const upgraded: V2.T = versions.upgrade(base)
    expect(upgraded.version).toEqual(2)
    expect(upgraded.nest.f2).toEqual(123)
  })
  it("upgrades from v1", () => {
    const v1: V1.T = { nest: { f: 2 }, version: 1 }
    const upgraded: V2.T = versions.upgrade(v1)
    expect(upgraded.version).toEqual(2)
    expect(upgraded.nest.f2).toEqual(123)
  })
  it("does nothing from v2", () => {
    const v2: V2.T = { nest: { f: 2, f2: 2 }, version: 2 }
    const upgraded: V2.T = versions.upgrade(v2)
    expect(upgraded).toBe(v2)
    expect(upgraded.version).toEqual(2)
    expect(upgraded.nest.f2).toEqual(2)
  })
})
