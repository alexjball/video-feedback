import { nanoid } from "nanoid"
import { model } from "../simulation"
import { Modify } from "../utils"
import db, { BaseTable, getExisting, Id } from "./core"
import images, { Image } from "./images"

export interface Keyframe {
  id: Id
  createdAt?: Date
  updatedAt?: Date
  // If basedOn is set, this keyframe is a fork of another
  basedOn?: Id
  name?: string
  state: model.State
  thumbnail: Image
}

export type DbKeyframe = Modify<
  Keyframe,
  {
    state: model.JsonState
    thumbnail: Id
  }
>
export type JsonKeyframe = DbKeyframe

type KeyframeUpdate = Modify<Partial<Keyframe>, { id: Id }>

export class Keyframes extends BaseTable<DbKeyframe, Keyframe> {
  async create(state: model.State, thumbnail: Blob, basedOnId?: Id) {
    const id = await db.transaction("rw", [db.keyframes, db.images], async () => {
      const image = await images.create(thumbnail)
      const createdAt = new Date()
      return this.table.add(
        deflateKeyframe({
          createdAt,
          updatedAt: createdAt,
          basedOn: basedOnId,
          id: nanoid(),
          state,
          thumbnail: image
        })
      )
    })
    return this.get(id)
  }
  async update({ id, ...update }: KeyframeUpdate) {
    await db.transaction("rw", [db.keyframes, db.images], async () => {
      const thumbnail = update.thumbnail
      if (thumbnail) {
        await images.update(thumbnail.id, thumbnail.blob)
      }
      update.updatedAt = new Date()
      return this.table.update(id, deflateKeyframe(update))
    })
    return this.get(id)
  }
  async put(keyframe: Keyframe) {
    await db.transaction("rw", [db.keyframes, db.images], async () => {
      if (keyframe.thumbnail) await images.put(keyframe.thumbnail)
      await this.table.put(deflateKeyframe(keyframe))
    })
  }

  get(id: string) {
    return getExisting(this.table, id).then(inflateKeyframe)
  }
}

export function deflateKeyframe(k: Partial<Keyframe>): DbKeyframe {
  const o: any = { ...k }
  if (k.state) {
    o.state = model.deflate(k.state)
  }
  if (k.thumbnail) {
    o.thumbnail = k.thumbnail.id
  }
  return o
}

async function inflateKeyframe(k: DbKeyframe): Promise<Keyframe> {
  return {
    ...k,
    state: model.inflate(k.state),
    thumbnail: await images.get(k.thumbnail)
  }
}

export default new Keyframes(db.keyframes)
