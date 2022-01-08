import db, { documents, keyframes } from "../db"
import { createAppThunk } from "../hooks"
import { SimulationService } from "../simulation"
import * as model from "./model"
import * as simulation from "../simulation"
import { RootState } from "../store"

type Condition = (arg: any, api: any) => boolean
const hasSelection: Condition = (_, { getState }) =>
    getState().io.selection?.keyframeId !== undefined,
  notModified: Condition = (_, { getState }) => !getState().io.selection?.modified

export const addKeyframe = createAppThunk(
  model.thunks.addKeyframe,
  async (simulation: SimulationService) => {
    const result = await simulation.convert(256)
    const keyframe = await db.keyframes.create(result.state, result.blob)
    return convertKeyframe(keyframe)
  }
)

export const snapshotKeyframe = createAppThunk(
  model.thunks.snapshotKeyframe,
  async (simulation: SimulationService, { getState }) => {
    const current = currentFrame(getState())!
    const result = await simulation.convert(256)
    const keyframe = await db.keyframes.update({
      id: current?.id,
      state: result.state,
      thumbnail: { id: current.thumbnailId, blob: result.blob }
    })
    return convertKeyframe(keyframe)
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
  async ({ id, create }: { id?: string; force?: boolean; create?: boolean }) => {
    let doc: documents.Document
    if (id && (await db.documents.exists(id))) {
      doc = await db.documents.get(id)
    } else if (create) {
      doc = await db.documents.create(id)
    } else {
      throw Error("Must specify create to create new documents")
    }
    return {
      ...doc,
      keyframes: doc.keyframes.map(convertKeyframe)
    }
  },
  {
    condition: ({ force }, { getState }) => !!force || !getState().io.selection?.modified
  }
)

function convertKeyframe(from: keyframes.Keyframe): model.Keyframe {
  const { thumbnail, ...keyframe } = from
  return {
    ...keyframe,
    thumbnail: URL.createObjectURL(thumbnail.blob),
    thumbnailId: thumbnail.id
  }
}

function currentFrame(s: RootState) {
  const id = s.io.selection.keyframeId
  return s.io.keyframes.find(k => k.id === id)
}
