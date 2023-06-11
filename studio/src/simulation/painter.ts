import {
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RGBAFormat,
  Texture,
  WebGLRenderer,
  WebGLRenderTarget
} from "three"
import { Binder } from "../utils"
import { State } from "./model"

// positions should be specified in destination coordinates?
type Operation = { index: number } & (
  | {
      type: "square"
      x: number
      y: number
    }
  | {
      type: "spraypaint"
      x: number
      y: number
    }
)

type Disposable = { dispose(): void }

class DrawingOperations implements Disposable {
  private cache = {
    available: new Map<string, Mesh[]>(),
    taken: new Map<string, Mesh[]>()
  }

  private reset() {
    this.cache.taken.forEach((values, key) => {
      const available = this.cache.available.get(key)!
      values.forEach(v => available.push(v))
    })
    this.cache.taken = new Map()
  }

  dispose() {
    ;[this.cache.available, this.cache.taken].forEach(m =>
      m.forEach(v =>
        v.forEach(m => {
          m.geometry.dispose()
          m.material?.dispose()
        })
      )
    )
  }

  render(renderer: WebGLRenderer, ops: Operation[]) {}

  private getOrCreate<K extends string, T extends Mesh>(key: string, create: () => T): T {
    if (!this.cache.available.has(key)) this.cache.available.set(key, [])
    if (!this.cache.taken.has(key)) this.cache.taken.set(key, [])

    const available = this.cache.available.get(key)!,
      taken = this.cache.taken.get(key)!,
      value = available.length > 1 ? available.pop()! : create()

    taken.push(value)

    return value as T
  }

  operations = {
    drawSquare: ({ x, y, size, color }: { x: number; y: number; size: number; color: number }) => {
      const square = this.getOrCreate(
        "square",
        () => new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: new Texture() }))
      )

      square.material.color.set("red")
      // set square position, scale, and rotation
      // add square to scene.
    },

    drawCircle: ({ radius }: { radius: number }) => {
      const square = this.getOrCreate(
        "circle",
        () => new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: new Texture() }))
      )

      square.material.color.set("red")
      // set square position, scale, and rotation
      // add square to scene.
    }
  }
}

type O = DrawingOperations["operations"]
type Ops<T extends keyof O> = {
  type: T
  payload: Parameters<O[T]>[0]
}
const makeOp = <T extends keyof O>(type: T, payload: Parameters<O[T]>[0]): Ops<T> => ({
  type,
  payload
})

const x = makeOp("drawCircle", { radius: 2 })
// type Ops = {[T: keyof DrawingOperations]: ObjectWithTheSameTypeAsTheInputs}

// The seed can be injected either during the destination render or during the source render.
export class Painter {
  readonly seed = new WebGLRenderTarget(0, 0, { format: RGBAFormat })

  private dirty = true
  private pendingOperations: Operation[] = []
  private currentOperationIndex = 0

  constructor() {}

  // The seed is part of the simulation state, so don't clear it when the resolution changes. Stretch to fit, and provide a separate button to clear it.
  // Store a modified bit in redux to enforce state changes.
  // When you save a state, write the seed to file and store the key in the document.
  readonly binder = new Binder<State>()
    .add(
      s => s.feedback.resolution,
      v => this.setSize(v.width, v.height)
    )
    .add(
      s => s.paint.operations,
      v => {
        this.pendingOperations = v as any
      },
      (ops1, ops2) => ops1.length === ops2.length
    )

  dispose() {
    this.seed.dispose()
  }

  private setSize(width: number, height: number) {
    this.seed.setSize(width, height)
  }

  // Undo support: After X seconds of no input, save a copy of the seed
  render(renderer: WebGLRenderer) {
    this.clearIfDirty(renderer)
    const ops = this.pendingOperations.filter(op => op.index > this.currentOperationIndex)
    // for each op, add an item to the scene, reusing per operation.
    // Render interactions to seed.
    drawingOperations.render(renderer, ops)
  }

  private clearIfDirty(renderer: WebGLRenderer) {
    if (this.dirty) {
      renderer.setClearColor("#000000", 0)
      renderer.setRenderTarget(this.seed)
      renderer.clear()
    }
  }
}

/**
 * How a touch becomes a seed
 *
 * - User switches focus to the seed layer and configures their paintbrush
 * - User touches screen
 * - Trasform screen pixel coordinates to destination coordinates
 * - Enqueue draw command as (shape, color, position)
 * - Each frame, set up the scene to execute the draw command and render it to the seed
 */
