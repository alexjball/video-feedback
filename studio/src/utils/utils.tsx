import { DependencyList, useMemo } from "react"

export function isDefined<T>(v: T | undefined): v is T {
  return v !== undefined
}

export type Resolve<T> = (v: T) => void
export type Reject = (e: any) => void
export type SettablePromise<T> = Promise<T> & { resolve: Resolve<T>; reject: Reject }

export function settablePromise<T>(): SettablePromise<T> {
  let resolve, reject
  const p: any = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  p.resolve = resolve
  p.reject = reject
  return p
}

export function useSingleton<T>(Class: { new (): T }, deps: DependencyList) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => new Class(), deps)
}

export function singleton<T>(Class: { new (): T }) {
  return new Class()
}

export type Modify<A, B> = Omit<A, keyof B> & B
