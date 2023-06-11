import { PayloadAction } from "@reduxjs/toolkit"
import { Vector3 } from "three"
import { createCaseReducers } from "../../utils"
import { copyCoords, getAngle, getCenter, getLength, m, o, pi2 } from "./helpers"
import type { Gesture, State } from "./model"

function applyPan(
  { gesture, viewer, spacemap: { coords: spacemap }, viewport }: State,
  update: Gesture
) {
  if (update.type !== "primary") return

  const start = gesture.start!,
    center = getCenter(update),
    startCenter = getCenter(start.g)

  const dx = center.x - startCenter.x,
    dy = center.y - startCenter.y,
    dragStart = start.spacemap

  const v = new Vector3(dx / viewport.width, -dy / viewport.height)
  o.from(viewer.coords).localToWorld(v)

  const s = o.from(dragStart)
  s.position.set(0, 0, 0)
  s.updateMatrixWorld()
  s.localToWorld(v)

  spacemap.position.x = dragStart.position.x - v.x
  spacemap.position.y = dragStart.position.y - v.y
}

function applyRotate({ spacemap: { coords: spacemap }, viewport, gesture }: State, g: Gesture) {
  const previous = gesture.previous!
  let feedbackAngle = 0,
    portalAngle = 0

  if (g.pointers.length === 1 && g.type === "alternate") {
    const dx = g.pointers[0].x - previous.pointers[0].x,
      dy = g.pointers[0].y - previous.pointers[0].y
    feedbackAngle = (dy / viewport.height) * pi2
    portalAngle = (dx / viewport.width) * pi2
  } else if (g.pointers.length === 2 && g.type === "primary") {
    feedbackAngle = getAngle(g) - getAngle(previous)
  }

  o.from(spacemap)
    .rotateZ(portalAngle + feedbackAngle)
    .to(spacemap)
  spacemap.position.applyMatrix4(m.makeRotationZ(portalAngle))
}

function applyZoom({ spacemap: { coords: spacemap }, gesture }: State, update: Gesture) {
  if (update.pointers.length !== 2 || update.type !== "primary") return

  const length = getLength(update),
    startLength = getLength(gesture.start?.g!),
    startScale = gesture.start!.spacemap.scale.x,
    disabled = startLength < 10,
    zoomFactor = length / startLength,
    scale = startScale / zoomFactor

  if (!disabled) {
    spacemap.scale.x = scale
    spacemap.scale.y = scale
  }
}

export const caseReducers = createCaseReducers({} as State, {
  updateGesture(
    state,
    { payload: update = { pointers: [], type: "primary" } }: PayloadAction<Gesture | undefined>
  ) {
    const {
      gesture,
      spacemap: { coords: spacemap }
    } = state

    if (update.pointers.length === 0) {
      gesture.start = undefined
      gesture.previous = undefined
    } else if (update.pointers.length !== gesture.start?.g.pointers.length) {
      gesture.start = { g: update, spacemap }
      gesture.previous = update
    } else {
      applyPan(state, update)
      applyRotate(state, update)
      applyZoom(state, update)
      gesture.previous = update
    }
  },
  drag(
    { spacemap: { coords: spacemap }, viewport, viewer, drag },
    {
      payload: { x, y, end = false, start = false }
    }: PayloadAction<{ x: number; y: number; end?: boolean; start?: boolean }>
  ) {
    if (start || !drag.start) {
      drag.start = {
        coords: copyCoords(spacemap),
        x,
        y
      }
    }

    const dx = x - drag.start.x,
      dy = y - drag.start.y,
      dragStart = drag.start.coords

    const v = new Vector3(dx / viewport.width, -dy / viewport.height)
    o.from(viewer.coords).localToWorld(v)

    const s = o.from(dragStart)
    s.position.set(0, 0, 0)
    s.updateMatrixWorld()
    s.localToWorld(v)

    spacemap.position.x = dragStart.position.x - v.x
    spacemap.position.y = dragStart.position.y - v.y

    if (end) {
      drag.start = null
    }
  },
  rotate(
    { spacemap: { coords: spacemap }, viewport },
    {
      payload: r
    }: PayloadAction<{ feedbackAngle?: number; portalAngle?: number; dx?: number; dy?: number }>
  ) {
    const feedbackAngle = r.feedbackAngle ?? (r.dy! / viewport.height) * pi2,
      portalAngle = r.portalAngle ?? (r.dx! / viewport.width) * pi2
    o.from(spacemap)
      .rotateZ(portalAngle + feedbackAngle)
      .to(spacemap)
    spacemap.position.applyMatrix4(m.makeRotationZ(portalAngle))
  },
  zoom({ spacemap }, { payload: distance }: PayloadAction<number>) {
    const pps = spacemap.pixelsPerScale
    spacemap.coords.scale.x += distance / pps
    spacemap.coords.scale.y += distance / pps
  }
})
