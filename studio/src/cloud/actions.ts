import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromCache,
  setDoc,
  Timestamp
} from "firebase/firestore"
import { getBlob, ref, uploadBytes } from "firebase/storage"
import { ValidationError } from "runtypes"
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
    const response = { docId, publicUrl: paths.publicUrl(uid, docId) }

    const isCacheUpToDate: boolean = await getDocFromCache(paths.publicDocument(uid, document.id))
      .then(doc => {
        const info = {
          updatedAt: document.updatedAt,
          remoteUpdatedAt: convertTimestamp(doc.data()?.updatedAt),
          docId: document.id
        }
        console.debug("Document cache info", info)
        const isCacheUpToDate = chooseVersion(info.updatedAt, info.remoteUpdatedAt) != "local"
        return isCacheUpToDate
      })
      .catch(e => {
        console.debug("Document not found in cache", e)
        return false
      })

    if (isCacheUpToDate) {
      console.log("Skipping publish. Document is already up to date in the cache")
      return response
    } else {
      console.debug("Uploading document and thumbnails", document)
    }

    await uploadThumbnails({ uid, document }).catch(e => {
      console.warn("Failed to upload thumbnail: ", e)
      throw rejectWithValue(fail(docId, "thumbnail-upload-failure", e.code))
    })

    await uploadDocument({ uid, document }).catch(e => {
      console.warn("Failed to upload document: ", e)
      throw rejectWithValue(fail(docId, "document-upload-failure", e.code))
    })

    return response
  }
)

export const unpublishDocument = createAppThunk(
  model.thunks.unpublishDocument,
  async (docId: string, { getState, rejectWithValue }) => {
    const s = getState(),
      uid = s.cloud.uid
    if (uid === null) {
      throw rejectWithValue(fail(docId, "unauthenticated"))
    } else if (s.io.document?.id === docId && s.io.selection.modified) {
      throw rejectWithValue(fail(docId, "unsaved-changes"))
    }

    await deleteDoc(paths.publicDocument(uid, docId))
  }
)

export const performInitialSyncToCloud = createAppThunk(
  model.thunks.performInitialSyncToCloud,
  async (_, { dispatch }) => {
    console.log("Performing initial sync to cloud")
    // Backfill missing updatedAt fields
    const docs = await db.documents.list()
    for (const docId of docs) {
      const doc = await db.documents.get(docId)
      let updatedKeyframe = false
      for (const keyframe of doc.keyframes) {
        if (!(keyframe.updatedAt instanceof Date)) {
          console.log("Backfilling keyframe update time", keyframe)
          await db.keyframes.touch(keyframe.id)
          updatedKeyframe = true
        }
      }
      if (!(doc.updatedAt instanceof Date) || updatedKeyframe) {
        console.log("Backfilling document update time", doc)
        await db.documents.touch(doc.id)
      }
    }

    // Sync all documents to the cloud
    console.log("Syncing documents to the cloud")
    for (const docId of docs) {
      await dispatch(publishDocument(docId))
    }
    console.log("Initial sync to cloud complete")
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

export const loadCloudDocument = async ({
  cloudDoc,
  uid
}: {
  uid: string
  cloudDoc: model.CloudDocument
}) => {
  try {
    // Update keyframes that are newer than the local version
    const localUpdateTimes = await db.keyframes.getUpdatedAt(cloudDoc.keyframes.map(k => k.id))
    for (const k of cloudDoc.keyframes) {
      const localUpdatedAt = localUpdateTimes.get(k.id)
      const remoteUpdatedAt = convertTimestamp(k.updatedAt)

      if (chooseVersion(localUpdatedAt, remoteUpdatedAt) == "remote") {
        console.log("Syncing cloud keyframe to local", k, localUpdatedAt, remoteUpdatedAt)
        await db.keyframes.put(
          await inflateKeyframe(uid, cloudDoc.id, {
            ...k,
            updatedAt: remoteUpdatedAt,
            createdAt: convertTimestamp(k.createdAt)
          })
        )
      } else {
        console.debug("Local is up to date, skipping keyframe download", k.id)
      }
    }

    // Update the document if it is newer than the local version
    const localUpdatedAt = await db.documents
      .getUpdatedAt([cloudDoc.id])
      .then(t => t.get(cloudDoc.id))
    const remoteUpdatedAt = convertTimestamp(cloudDoc.updatedAt)
    if (chooseVersion(localUpdatedAt, remoteUpdatedAt) == "remote") {
      console.log("Syncing cloud document to local", cloudDoc)
      await db.documents.put({
        ...cloudDoc,
        updatedAt: convertTimestamp(cloudDoc.updatedAt),
        createdAt: convertTimestamp(cloudDoc.createdAt),
        keyframes: cloudDoc.keyframes.map(k => k.id)
      })
    } else {
      console.debug("Local is up to date, skipping document download", cloudDoc.id)
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      console.warn("Cloud document validation error", error, cloudDoc)
    } else {
      throw error
    }
  }
  return document
}

function chooseVersion(
  localUpdatedAt: Date | undefined,
  remoteUpdatedAt: Date | undefined
): "local" | "remote" | "equal" {
  // Prefer local if both are missing timestamps
  if (!remoteUpdatedAt && !localUpdatedAt) {
    return "local"
  }

  // Prefer remote if local is missing a timestamp
  if (!localUpdatedAt) {
    return "remote"
  }

  // Prefer local if remote is missing a timestamp
  if (!remoteUpdatedAt) {
    return "local"
  }

  if (remoteUpdatedAt > localUpdatedAt) {
    return "remote"
  } else if (remoteUpdatedAt < localUpdatedAt) {
    return "local"
  } else {
    return "equal"
  }
}

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

export const paths = {
  thumbnail: (uid: string, docId: string, thumbnailId: string) =>
    ref(storage, `/users/${uid}/public/documents/${docId}/thumbnails/${thumbnailId}`),
  publicDocument: (uid: string, docId: string) =>
    doc(firestore, "users", uid, "publicDocuments", docId),
  publicDocsForUser: (uid: string) => collection(firestore, "users", uid, "publicDocuments"),
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
    document.keyframes.map(keyframe => inflateKeyframe(uid, document.id, keyframe))
  )
}

async function inflateKeyframe(uid: string, docId: string, keyframe: keyframes.DbKeyframe) {
  const thumbnailId = keyframe.thumbnail,
    thumbnailRef = paths.thumbnail(uid, docId, thumbnailId),
    blob = await getBlob(thumbnailRef)

  return {
    ...keyframe,
    state: simulation.inflate(keyframe.state),
    thumbnail: { id: thumbnailId, blob }
  }
}

function convertTimestamp(t: Timestamp | undefined): Date | undefined {
  try {
    return t?.toDate()
  } catch (e) {
    console.error("Failed to convert timestamp", t, e)
  }
}
