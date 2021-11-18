import { Mesh, MeshBasicMaterial, PlaneGeometry, Vector3 } from "three"

describe("three", () => {
  it("scales, rotates, and translates in that order", () => {
    const e = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial())

    const a = e.geometry.getAttribute("position")
    const v1 = new Vector3().fromBufferAttribute(a, 0)

    expect(v1).toEqual({ x: -0.5, y: 0.5, z: 0 })

    e.scale.x = 10
    e.rotateZ(Math.PI / 2)
    e.position.y = 10

    e.updateMatrixWorld()
    e.localToWorld(v1)

    expect(v1.x).toBeCloseTo(-0.5)
    expect(v1.y).toBeCloseTo(5)
    expect(v1.z).toBeCloseTo(0)
  })
})
