const { spawnSync } = require("child_process")
const {
  demoProjectId,
  paths,
  removeBuildOutput,
  linkBuildOutput,
  generatePackageJson
} = require("./common")

removeBuildOutput()
linkBuildOutput()
generatePackageJson()
spawnSync("firebase", ["--project", demoProjectId, "emulators:exec", "--ui", paths.emulate], {
  stdio: "inherit"
})
