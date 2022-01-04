import db from "../db"
import { createAppThunk } from "../hooks"
import { SimulationService } from "../simulation"
import * as model from "./model"
import * as simulation from "../simulation"

const hasSelection = (_: any, { getState }: any) =>
  getState().io.selection?.keyframeId !== undefined

export const addKeyframe = createAppThunk(
  model.thunks.addKeyframe,
  async (simulation: SimulationService) => {
    const result = await simulation.convert(256)
    const { thumbnail, ...keyframe } = await db.documents.createKeyframe(result.state, result.blob)
    return {
      ...keyframe,
      thumbnail: URL.createObjectURL(thumbnail)
    }
  }
)

export const snapshotKeyframe = createAppThunk(
  model.thunks.snapshotKeyframe,
  async (simulation: SimulationService, { getState }) => {
    const id = getState().io.selection.keyframeId!
    const result = await simulation.convert(256)
    await db.documents.updateKeyframe(id, {
      state: result.state,
      thumbnail: result.blob
    })
    return {
      id,
      state: result.state,
      thumbnail: URL.createObjectURL(result.blob)
    }
  },
  { condition: hasSelection }
)

export const deleteKeyframe = createAppThunk(
  model.thunks.deleteKeyframe,
  async (_: void, { getState }) => {
    const state = getState().io
    const id = state.selection.keyframeId!
    await db.documents.deleteKeyframe(id)
    return id
  },
  { condition: hasSelection }
)

export const undoKeyframe = createAppThunk(
  model.thunks.undoKeyframe,
  async (_: void, { getState, dispatch }) => {
    const id = getState().io.selection.keyframeId!
    const currentFrame = getState().io.keyframes.find(k => k.id === id)
    if (currentFrame) {
      dispatch(simulation.model.restore(currentFrame.state))
    }
    return id
  },
  { condition: hasSelection }
)
