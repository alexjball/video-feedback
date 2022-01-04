import dynamic from "next/dynamic"

export { reducer } from "./model"
export const IoPanel = dynamic(() => import("./io-panel"), {
  ssr: false
})
