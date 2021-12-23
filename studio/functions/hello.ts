// There is no default export, must use * as...
// Failure only happens in webpack
import * as functions from "firebase-functions"

export const echo = functions.https.onCall(
  (text, context) =>
    `Hello ${context.auth?.uid ?? "stranger"}! :) ${
      typeof text === "string" ? text : "Data should be a plain string"
    }`
)

/**
 * Playlists and states are private by default, only accessible to the owner. They can be public, accessible to anyone (authed or not).
 * owners can share entire playlists or individual states.
 * owners are authenticated users, so users must be authenticated to share.
 * sharing makes the item public and adds it to the front page.
 * Sharing a playlist makes its states public but does not add them to the front page.
 * The document is automatically persisted locally.
 * The document is manually saved to the cloud and shared.
 * The document is saved before sharing.
 *
 * Make more sense to completely separate published and editor state? Sharing would copy the current state into a published collection. Opening the published state in the editor copies the state into the application, which can then be saved/published again. So published states act like templates.
 *
 * users/id/playlists/id {
 *
 *  /states/id {
 *
 * }
 * }
 */
