import "../src/ui/bootstrap.css"
import type { AppProps } from "next/app"
import Head from "next/head"
import * as three from "three"
import { Providers } from "../src/providers"

importBootstrapCss()

if (global.window) window.THREE = three

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Feedback Studio</title>
      </Head>

      <Providers>
        <Component {...pageProps} />
      </Providers>
    </>
  )
}

export default App

function importBootstrapCss() {
  const userPreference = typeof localStorage !== "undefined" && localStorage.getItem("colorTheme"),
    osPreference =
      typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)")
        ? "dark"
        : "light",
    mode = typeof userPreference === "string" ? userPreference : osPreference

  switch (mode) {
    case "dark":
      import("bootswatch/dist/darkly/bootstrap.min.css")
      return
    case "light":
      import("bootswatch/dist/flatly/bootstrap.min.css")
      return
    default:
      throw Error("Invalid color theme " + mode)
  }
}
