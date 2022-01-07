const { spawnSync } = require("child_process")
const { removeBuildOutput, generatePackageJson, copyBuildOutput } = require("./common")

removeBuildOutput()
generatePackageJson()
spawnSync("npm", ["run", "build"], { stdio: "inherit" })
copyBuildOutput()
console.log("Finished build")
