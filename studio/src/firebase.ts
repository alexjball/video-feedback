import { initializeApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjqfoPgSIKMxgNEJgjGxkiMd0ChUWYWgY",
  authDomain: "video-feedback-dev.firebaseapp.com",
  projectId: "video-feedback-dev",
  storageBucket: "video-feedback-dev.appspot.com",
  messagingSenderId: "797587884391",
  appId: "1:797587884391:web:0f74de9363636ceb7c47c2",
  measurementId: "G-3X8FP070NN"
}

export const app = initializeApp(firebaseConfig)
export const analytics = getAnalytics(app)
