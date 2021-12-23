import { initializeApp } from "firebase/app"
import { getStorage } from "firebase/storage"
import { getFirestore } from "firebase/firestore"
import firebaseConfig from "../firebase-config.json"

export const app = initializeApp(firebaseConfig)
export const storage = getStorage(app)
export const firestore = getFirestore(app)
