import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene } from "three"
import type { AppStore } from "./store"
import * as three from "./three"

class Renderer extends three.WebGlRenderer {
  private scene

  constructor(store: AppStore) {
    super(store)
    this.scene = this.createScene()
  }

  override setSize(width: number, height: number) {
    super.setSize(width, height)
    this.scene.camera.aspect = width / height
    this.scene.camera.updateProjectionMatrix()
  }

  private createScene() {
    const { width, height } = this.size
    const camera = new PerspectiveCamera(75, width / height, 0.1, 1000)
    const scene = new Scene()
    const geometry = new BoxGeometry()
    const material = new MeshBasicMaterial({ color: 0x00ffff })
    const cube = new Mesh(geometry, material)
    scene.add(cube)

    camera.position.z = 5

    return {
      scene,
      geometry,
      material,
      cube,
      camera
    }
  }

  i = 0
  t = performance.now()

  override renderFrame = () => {
    const f = 120
    const { scene, cube, camera } = this.scene

    if (++this.i % f === 0) {
      const now = performance.now(),
        fps = (f / (now - this.t)) * 1000
      this.t = now
      console.log(`${fps} fps`)
    }

    cube.rotation.x += 0.01
    cube.rotation.y += 0.01

    this.renderScene(scene, camera, null)
  }
}

export const Demo = three.asComponent(Renderer)
