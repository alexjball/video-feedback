// There is no default export, must use * as...
// Failure only happens in webpack
import * as functions from "firebase-functions"

export const echo = functions.https.onCall(
  (text, context) =>
    `Hello ${context.auth?.uid ?? "stranger"}! :) ${
      typeof text === "string" ? text : "Data should be a plain string"
    }`
)
