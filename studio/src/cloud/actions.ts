import { doc, getDoc, setDoc } from "firebase/firestore"
import { getBlob, ref, uploadBytes } from "firebase/storage"
import db, { documents, keyframes } from "../db"
import { firestore, storage } from "../firebase"
import { createAppThunk } from "../hooks"
import * as io from "../io"
import { model as simulation } from "../simulation"
import * as model from "./model"

/**
 * Publish the current version of the given document to /view?u=uid&doc=docId
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

    return { docId, publicUrl: paths.publicUrl(uid, docId) }
  }
)

/**
 * Load the document at /view?u=authorUid&doc=docId
 */
export const viewPublicDocument = createAppThunk(
  model.thunks.viewPublicDocument,
  async (
    { authorUid, docId, io: service }: { io: io.IoService; authorUid: string; docId: string },
    { dispatch }
  ) => {
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
    // Actually, don't write to the database at all in view mode.
    await dispatch(io.actions.viewDocument({ io: service, document }))
  },
  { condition: args => !!args?.io }
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
  publicUrl: (uid: string, docId: string) => `${window.origin}/view?u=${uid}&doc=${docId}`
}

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
        state: simulation.inflate(keyframe.state),
        thumbnail: { id: thumbnailId, blob }
      }
    })
  )
}
