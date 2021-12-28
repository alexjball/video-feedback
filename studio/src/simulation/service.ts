import { createService } from "../utils"
import { State } from "./model"

export interface SimulationService {
  setState(state: State): void
  clearFrames(color: boolean, depth: boolean): void
  setPlayback(action: PlaybackAction): void
  getPlayback(): PlaybackState
  /** Generates a PNG blob of the current feedback frame. */
  convert(height?: number, width?: number): Promise<Blob>
}

export const { Provider, useBinding, useService } = createService<SimulationService>()

export type PlaybackAction = "start" | "stop" | "step"
export type PlaybackState = "playing" | "stopped"
