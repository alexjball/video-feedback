import "bootstrap/dist/css/bootstrap.min.css"
import "../styles/globals.css"
import type { AppProps } from "next/app"
import Head from "next/head"
import * as three from "three"
import { Providers } from "../src/providers"

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
