import { WebGLRenderer } from "three"

export type Work<T> = (renderer: WebGLRenderer) => Promise<T> | T
export class WorkQueue {
  queue: { result: Result<any>; run: Work<any> }[] = []
  push<T>(work: Work<T>): Promise<T> {
    const result = new Result<T>()
    this.queue.push({
      result,
      run(r: WebGLRenderer) {
        const p = work(r),
          isPromise = p !== undefined && p instanceof Promise
        result.set(isPromise ? p : Promise.resolve(p))
      }
    })
    return result.promise
  }
  run(r: WebGLRenderer) {
    this.queue.forEach(w => w.run(r))
    this.queue = []
  }
  dispose() {
    this.queue.forEach(w => w.result.reject(new Error("Renderer disposed")))
    this.queue = []
  }
}

type Resolve<T> = (value: T | PromiseLike<T>) => void
type Reject = (reason?: any) => void

class Result<T> {
  promise: Promise<T>
  resolve: Resolve<T> = () => {}
  reject: Reject = () => {}

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }

  set(p: Promise<T>) {
    p.then(this.resolve).catch(this.reject)
    return this
  }
}
