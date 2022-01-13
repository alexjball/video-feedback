import { createService } from "../utils"

export interface StudioService {
  requestFullscreen(): void
}

export const { Provider, useService, useBinding } = createService<StudioService>()
