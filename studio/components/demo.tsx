import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene } from "three"
import { Renderer, withThree } from "./three"

class Demo extends Renderer {
  private scene

  constructor(canvas: HTMLCanvasElement) {
    super(canvas)
    this.scene = this.createScene()
  }

  override resize({ width, height }: { width: number; height: number }) {
    super.resize({ width, height })
    this.scene.camera.aspect = width / height
    this.scene.camera.updateProjectionMatrix()
  }

  private createScene() {
    const { width, height } = this.size
    const camera = new PerspectiveCamera(75, width / height, 0.1, 1000)
    const scene = new Scene()
    const geometry = new BoxGeometry()
    const material = new MeshBasicMaterial({ color: 0x00ff00 })
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

    this.renderer.render(scene, camera)
  }
}

export default withThree(Demo)
