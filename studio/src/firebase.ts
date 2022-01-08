import { initializeApp } from "firebase/app"
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { getStorage, connectStorageEmulator } from "firebase/storage"
import { initializeFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getFunctions, connectFunctionsEmulator } from "firebase/functions"
import firebaseConfig from "../firebase-config.json"

const config = { ...firebaseConfig }
if (process.env.NEXT_PUBLIC_PROJECT_ID) {
  config.projectId = process.env.NEXT_PUBLIC_PROJECT_ID
}

export const app = initializeApp(config)
export const storage = getStorage(app)
export const firestore = initializeFirestore(app, { ignoreUndefinedProperties: true })
export const functions = getFunctions(app)
export const auth = getAuth(app)

if (process.env.NODE_ENV !== "production") {
  const useEmulator = process.env.NEXT_PUBLIC_USE_EMULATOR
  switch (useEmulator) {
    case "1":
    case "true":
      connectEmulators()
      break
    case "0":
    case "false":
    case "":
    case undefined:
      break
    default:
      throw Error("Unsupported emulator option " + useEmulator)
  }
}

/** Connect emulators according to firebase.json */
function connectEmulators() {
  connectFirestoreEmulator(firestore, "localhost", 8080)
  connectFunctionsEmulator(functions, "localhost", 5001)
  connectStorageEmulator(storage, "localhost", 9199)
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true })
  console.log("Connected to emulators")
}
