import dynamic from "next/dynamic"

export const Portfolio = dynamic(() => import("./portfolio"), {
  ssr: false
})

export * from "./model"
