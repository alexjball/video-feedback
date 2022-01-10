import { nanoid } from "nanoid"
import db, { documents, keyframes } from "../db"
import { createAppThunk } from "../hooks"
import * as simulation from "../simulation"
import { SimulationService } from "../simulation"
import { RootState } from "../store"
import { isDefined } from "../utils"
import * as model from "./model"
import { IoService } from "./service"

type Services = { simulation: SimulationService; io: IoService }
type Condition = (arg: any, api: any) => boolean
const hasSelection: Condition = (_, { getState }) =>
  getState().io.selection?.keyframeId !== undefined

export const addKeyframe = createAppThunk(
  model.thunks.addKeyframe,
  async ({ simulation, io }: Services) => {
    const result = await simulation!.convert(256)
    const keyframe = await db.keyframes.create(result.state, result.blob)
    return convertKeyframe(io!, keyframe)
  }
)

export const snapshotKeyframe = createAppThunk(
  model.thunks.snapshotKeyframe,
  async ({ simulation, io }: Services, { getState }) => {
    const current = currentFrame(getState())!
    const result = await simulation!.convert(256)
    const keyframe = await db.keyframes.update({
      id: current?.id,
      state: result.state,
      thumbnail: { id: current.thumbnailId, blob: result.blob }
    })
    return convertKeyframe(io!, keyframe)
  },
  { condition: hasSelection }
)

export const deleteKeyframe = createAppThunk(
  model.thunks.deleteKeyframe,
  async (_: void, { getState }) => {
    const id = getState().io.selection.keyframeId!
    await db.keyframes.delete(id)
    return id
  },
  { condition: hasSelection }
)

export const undoKeyframe = createAppThunk(
  model.thunks.undoKeyframe,
  async (_: void, { getState, dispatch }) => {
    const current = currentFrame(getState())!
    dispatch(simulation.model.restore(current.state))
    return current.id
  },
  { condition: hasSelection }
)

export const openDocument = createAppThunk(
  model.thunks.openDocument,
  async ({ id, create, io }: { id?: string; create?: boolean; io: IoService }) => {
    const exists = id && (await db.documents.exists(id))
    let doc: documents.Document
    if (id && exists) {
      doc = await db.documents.get(id)
    } else if (create) {
      doc = await db.documents.create(id)
    } else if (exists) {
      throw Error("Must specify create to create new documents")
    } else {
      throw Error(`Document ${id} does not exist`)
    }
    return convertDocument(io!, doc)
  }
)

/**
 * Save the open document to a new persistent database document. The document,
 * keyframes, and thumbnails all recieve new ID's.
 */
export const saveAsDocument = createAppThunk(
  model.thunks.saveAsDocument,
  async ({ io }: { io: IoService }, { getState }) => {
    const s = getState().io,
      docId = nanoid(),
      document: documents.Document = {
        id: docId,
        name: s.document?.title,
        keyframes: s.keyframes.map(k => ({
          id: nanoid(),
          state: k.state,
          name: k.name,
          thumbnail: {
            id: nanoid(),
            blob: io!.resolveBlob(k.thumbnail)!
          }
        }))
      }
    await db.documents.put(document)
    return convertDocument(io!, await db.documents.get(docId))
  }
)

export const viewDocument = createAppThunk(
  model.thunks.viewDocument,
  async ({ document, io }: { document: documents.Document; io: IoService }) =>
    convertDocument(io!, document)
)

function convertDocument(io: IoService, document: documents.Document) {
  return {
    ...document,
    keyframes: document.keyframes.map(k => convertKeyframe(io, k))
  }
}

function convertKeyframe(io: IoService, from: keyframes.Keyframe): model.Keyframe {
  const { thumbnail, ...keyframe } = from

  return {
    ...keyframe,
    thumbnail: io.createUrl(thumbnail.blob),
    thumbnailId: thumbnail.id
  }
}

function currentFrame(s: RootState) {
  const id = s.io.selection.keyframeId
  return s.io.keyframes.find(k => k.id === id)
}
