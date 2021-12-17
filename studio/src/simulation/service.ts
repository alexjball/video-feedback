import { createService } from "../utils"
import { State } from "./model"

export interface SimulationService {
  setState(state: State): void
  setPlayback(action: PlaybackAction): void
  /** Generates a PNG blob of the current feedback frame. */
  convert(height?: number, width?: number): Promise<Blob>
}

export const { Provider, useBinding, useService } = createService<SimulationService>()

export type PlaybackAction = "start" | "stop" | "step"
