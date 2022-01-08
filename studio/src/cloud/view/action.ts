import db, { documents, keyframes } from "../../db"
import { createAppThunk } from "../../hooks"
import * as model from "../model"
import { inflate, model as simulation } from "../../simulation"
import { firestore, storage } from "../../firebase"
import { ref, getBlob } from "firebase/storage"
import { doc, getDoc } from "firebase/firestore"
import { openDocument } from "../../io/actions"

export const viewPublicDocument = createAppThunk(
  model.thunks.viewPublicDocument,
  async ({ authorUid, docId }: { authorUid: string; docId: string }, { dispatch }) => {
    const doc = await getDoc(paths.publicDocument(authorUid, docId))
    if (!doc.exists()) {
      throw new Error("Document does not exist")
    }
    const json = doc.data() as documents.JsonDocument

    const document: documents.Document = {
      ...json,
      keyframes: await inflateKeyframes({ uid: authorUid, document: json })
    }

    // TODO: Use different ID's for published documents.
    // Currently this will overwrite the owner's local document
    await db.documents.put(document)
    await dispatch(openDocument({ id: document.id, force: true }))
  }
)

function inflateKeyframes({
  uid,
  document
}: {
  uid: string
  document: documents.JsonDocument
}): Promise<keyframes.Keyframe[]> {
  return Promise.all(
    document.keyframes.map(async keyframe => {
      const thumbnailId = keyframe.thumbnail,
        thumbnailRef = paths.thumbnail(uid, document.id, thumbnailId),
        blob = await getBlob(thumbnailRef)

      return {
        ...keyframe,
        state: simulation.State.check(inflate(keyframe.state)),
        thumbnail: { id: thumbnailId, blob }
      }
    })
  )
}

const paths = {
  thumbnail: (uid: string, docId: string, thumbnailId: string) =>
    ref(storage, `/users/${uid}/public/documents/${docId}/thumbnails/${thumbnailId}`),
  publicDocument: (uid: string, docId: string) =>
    doc(firestore, "users", uid, "publicDocuments", docId),
  privateDocument: (uid: string, docId: string) =>
    doc(firestore, "users", uid, "privateDocuments", docId),
  publicUrl: (uid: string, docId: string) => `${window.origin}/v/${uid}/${docId}`
}
