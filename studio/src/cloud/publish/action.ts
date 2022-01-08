import db, { documents } from "../../db"
import { createAppThunk } from "../../hooks"
import * as model from "../model"
import { firestore, storage } from "../../firebase"
import { ref, uploadBytes } from "firebase/storage"
import { doc, setDoc } from "firebase/firestore"

/**
 * Publish the current version of the given document to /v/uid/docId
 */
export const publishDocument = createAppThunk(
  model.thunks.publishDocument,
  async (docId: string, { getState, rejectWithValue }) => {
    const s = getState(),
      uid = s.cloud.uid
    if (uid === null) {
      throw rejectWithValue(fail(docId, "unauthenticated"))
    } else if (s.io.document?.id === docId && s.io.selection.modified) {
      throw rejectWithValue(fail(docId, "unsaved-changes"))
    }

    const document = await db.documents.get(docId)

    await uploadThumbnails({ uid, document }).catch(e => {
      console.warn("Failed to upload thumbnail: ", e)
      throw rejectWithValue(fail(docId, "thumbnail-upload-failure", e.code))
    })

    await uploadDocument({ uid, document }).catch(e => {
      console.warn("Failed to upload document: ", e)
      throw rejectWithValue(fail(docId, "document-upload-failure", e.code))
    })

    return paths.publicUrl(uid, docId)
  }
)

function fail(docId: string, reason: model.ErrorReason, code?: string): model.PublishRejection {
  return { docId, reason, code }
}

async function uploadDocument({ uid, document }: { uid: string; document: documents.Document }) {
  await setDoc(paths.publicDocument(uid, document.id), documents.toJson(document))
}

async function uploadThumbnails({ uid, document }: { uid: string; document: documents.Document }) {
  await Promise.all(
    document.keyframes.map(keyframe => {
      const thumbnail = keyframe.thumbnail,
        thumbnailRef = paths.thumbnail(uid, document.id, thumbnail.id)

      return uploadBytes(thumbnailRef, thumbnail.blob)
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
  publicUrl: (uid: string, docId: string) => `${window.origin}/view/${uid}/${docId}`
}
