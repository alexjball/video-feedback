#!/Users/aball/.nvm/versions/node/v16.17.0/bin/node

const { spawnSync } = require("child_process")
const { demoProjectId } = require("./common")

spawnSync("npm", ["run", "dev"], {
  env: {
    ...process.env,
    NEXT_PUBLIC_USE_EMULATOR: true,
    NEXT_PUBLIC_PROJECT_ID: demoProjectId
  },
  stdio: "inherit"
})
