const { initializeApp } = require("firebase/app")
const { getFunctions, httpsCallable } = require("firebase/functions")
const firebaseConfig = require("../../firebase-config.json")

if (process.argv.length !== 4) {
  console.log("Usage: call.js service data")
  process.exit(0)
}
const service = process.argv[2],
  data = JSON.parse(process.argv[3])

const app = initializeApp(firebaseConfig)
const functions = getFunctions(app)

httpsCallable(
  functions,
  service
)(data)
  .then(result => {
    console.log("result", result)
  })
  .catch(error => {
    console.log("error", error)
  })
