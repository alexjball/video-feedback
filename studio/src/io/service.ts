import { isEqual } from "lodash"
import { nanoid } from "nanoid"
import { useEffect, useMemo, useRef } from "react"
import db, { documents, keyframes } from "../db"
import { useAppDispatch, useAppSelector, useAppStore } from "../hooks"
import * as simulation from "../simulation"
import { createService, isDefined } from "../utils"
import * as model from "./model"

export type IoService = NonNullable<ReturnType<typeof useService>>
export const { Provider, useService } = createService(() => {
  useApplySelection()
  useStateId()
  usePushUpdatesToDatabase()
  const cache = useBlobCache()
  const loader = useModelLoader(cache)
  return useMemo(() => ({ ...cache, ...loader }), [cache, loader])
})

type BlobCache = ReturnType<typeof useBlobCache>
function useBlobCache() {
  return useMemo(() => {
    const urlsByBlob = new Map<Blob, string>(),
      blobsByUrl = new Map<string, Blob>()
    return {
      createUrl: (blob: Blob) => {
        const url = URL.createObjectURL(blob)
        urlsByBlob.set(blob, url)
        blobsByUrl.set(url, blob)
        return url
      },
      resolveBlob: (url: string) => {
        return blobsByUrl.get(url)
      },
      revokeUrl: (url: string) => {
        URL.revokeObjectURL(url)
        const blob = blobsByUrl.get(url)
        if (blob) {
          blobsByUrl.delete(url)
          urlsByBlob.delete(blob)
        }
      }
    }
  }, [])
}

function useModelLoader(blobCache: BlobCache) {
  return useMemo(() => {
    return {
      convertDocument(document: documents.Document): model.Document {
        return {
          ...document,
          keyframes: document.keyframes.map(k => this.convertKeyframe(k))
        }
      },

      convertKeyframe(from: keyframes.Keyframe): model.Keyframe {
        const { thumbnail, ...keyframe } = from

        return {
          ...keyframe,
          thumbnail: blobCache.createUrl(thumbnail.blob),
          thumbnailId: thumbnail.id
        }
      }
    }
  }, [blobCache])
}

function useApplySelection() {
  const dispatch = useAppDispatch(),
    { getState } = useAppStore(),
    selection = useAppSelector(s => s.io.selection)
  useEffect(() => {
    if (selection.keyframeId && !isDefined(selection.stateId)) {
      dispatch(
        simulation.model.restore(
          getState().io.keyframes.find(k => k.id === selection.keyframeId)!.state
        )
      )
    }
  }, [dispatch, getState, selection])
}

function useStateId() {
  const dispatch = useAppDispatch()
  const modifiers: Record<string, any> = useAppSelector(
    ({
      simulation: {
        feedback: { resolution: _1, nFrames: _2, ...feedback },
        drag: _3,
        viewport: _4,
        gesture: _5,
        ...modifiers
      }
    }) => ({
      feedback,
      ...modifiers
    }),
    isEqual
  )
  const previous = useRef(modifiers)
  useEffect(() => {
    // Log what changed
    const didChange: Record<string, any> = {}
    for (const k of Object.keys(modifiers)) {
      didChange[k] = !isEqual(modifiers[k], previous.current[k])
    }
    console.debug("state change", { didChange, modifiers, previous: previous.current })
    dispatch(model.updateStateId(nanoid()))
    previous.current = modifiers
  }, [modifiers, dispatch])
}

type DocumentUpdate = {
  doc: documents.DbDocument
  keyframeUpdates: { id: string; updatedAt?: Date }[]
}

function usePushUpdatesToDatabase() {
  const viewOnly = useAppSelector(s => s.studio.mode === "view"),
    previous = useRef<DocumentUpdate | undefined>(undefined),
    update: DocumentUpdate | undefined = useAppSelector(
      s =>
        s.io.document && {
          doc: {
            id: s.io.document.id,
            name: s.io.document.title,
            keyframes: s.io.keyframes.map(k => k.id)
          },
          keyframeUpdates: s.io.keyframes.map(k => ({ id: k.id, updatedAt: k.updatedAt }))
        },
      isEqual
    )
  useEffect(
    () =>
      void (async () => {
        try {
          if (update && previous.current && !viewOnly) {
            await db.documents.update(update.doc)
          }
        } catch (e) {
          console.error("error updating document", e)
        }
        if (update !== previous.current) {
          previous.current = update
        }
      })(),
    [update, viewOnly]
  )
}
