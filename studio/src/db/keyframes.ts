import { nanoid } from "nanoid"
import { deflate, inflate, model } from "../simulation"
import { Modify } from "../utils"
import db, { BaseTable, getExisting, Id } from "./core"
import images, { Image } from "./images"

export interface Keyframe {
  id: Id
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
  async create(state: model.State, thumbnail: Blob) {
    const id = await db.transaction("rw", [db.keyframes, db.images], async () => {
      const image = await images.create(thumbnail)
      return this.table.add(
        deflateKeyframe({
          id: nanoid(),
          state,
          thumbnail: image
        })
      )
    })
    return this.get(id)
  }
  async update({ id, thumbnail, ...update }: KeyframeUpdate) {
    await db.transaction("rw", [db.keyframes, db.images], async () => {
      if (thumbnail) {
        await images.update(thumbnail.id, thumbnail.blob)
      }
      return this.table.update(id, deflateKeyframe(update))
    })
    return this.get(id)
  }
  get(id: string) {
    return getExisting(this.table, id).then(inflateKeyframe)
  }
}

export function deflateKeyframe(k: Partial<Keyframe>): DbKeyframe {
  const o: any = { ...k }
  if (k.state) {
    o.state = model.JsonState.check(deflate(k.state))
  }
  if (k.thumbnail) {
    o.thumbnail = k.thumbnail.id
  }
  return o
}

async function inflateKeyframe(k: DbKeyframe): Promise<Keyframe> {
  return {
    ...k,
    state: model.State.check(inflate(k.state)),
    thumbnail: await images.get(k.thumbnail)
  }
}

export default new Keyframes(db.keyframes)
