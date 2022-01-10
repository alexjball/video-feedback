import dynamic from "next/dynamic"

export const IoPanel = dynamic(() => import("./io-panel"), {
  ssr: false
})

export { reducer } from "./model"
export * as actions from "./actions"
export * from "./service"
