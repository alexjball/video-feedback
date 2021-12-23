const SSRPlugin = require("next/dist/build/webpack/plugins/nextjs-ssr-import").default
const { dirname, relative, resolve, join } = require("path")

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  eslint: {
    dirs: ["pages", "src", "components", "lib", "firebase"]
  },
  webpack: (config, props) => {
    patchSsrPlugin(config)
    addCloudFunctionEntry(config, props)
    return config
  }
}

function addCloudFunctionEntry(config, { isServer }) {
  if (!isServer) return

  const nextEntry = config.entry
  config.entry = () =>
    nextEntry().then(entry =>
      Object.assign(entry, {
        "firebase-functions": "./functions/index.ts"
      })
    )
}

// From https://github.com/vercel/next.js/issues/22581#issuecomment-864476385
// Patch the NextJsSSRImport plugin to not throw with WASM generated chunks.
function patchSsrPlugin(config) {
  const ssrPlugin = config.plugins.find(plugin => plugin instanceof SSRPlugin)
  if (!ssrPlugin) return

  ssrPlugin.apply = compiler => {
    compiler.hooks.compilation.tap("NextJsSSRImport", compilation => {
      compilation.mainTemplate.hooks.requireEnsure.tap("NextJsSSRImport", (code, chunk) => {
        // Patch the hook to return if the chunk doesn't have a name
        if (!chunk.name) return

        // Copied from https://github.com/vercel/next.js/blob/canary/packages/next/build/webpack/plugins/nextjs-ssr-import.ts

        // Update to load chunks from our custom chunks directory
        const outputPath = resolve("/")
        const pagePath = join("/", dirname(chunk.name))
        const relativePathToBaseDir = relative(pagePath, outputPath)
        // Make sure even in windows, the path looks like in unix
        // Node.js require system will convert it accordingly
        const relativePathToBaseDirNormalized = relativePathToBaseDir.replace(/\\/g, "/")
        return code
          .replace('require("./"', `require("${relativePathToBaseDirNormalized}/"`)
          .replace(
            "readFile(join(__dirname",
            `readFile(join(__dirname, "${relativePathToBaseDirNormalized}"`
          )
      })
    })
  }
}
