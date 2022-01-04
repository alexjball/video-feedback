import { Table } from "dexie"
import { nanoid } from "nanoid"
import { deflate, inflate, model } from "../simulation"
import db from "./core"

export type Id = string

export interface Document {
  id: Id
  name?: string
  // version: number
  keyframes: Keyframe[]
}

export interface Keyframe {
  id: Id
  name?: string
  state: model.State
  // Make sure this is async
  thumbnail: Blob
}

export interface DbDocument extends Omit<Document, "keyframes"> {
  keyframes: Id[]
}

export class Documents {
  async create(): Promise<Document> {
    const id = await db.documents.add({
      id: nanoid(),
      keyframes: []
    })
    return this.get(id)
  }
  async createKeyframe(state: model.State, thumbnail: Blob): Promise<Keyframe> {
    const id = await db.keyframes.add(
      deflateKeyframe({
        id: nanoid(),
        state,
        thumbnail
      })
    )
    return getExisting(db.keyframes, id).then(inflateKeyframe)
  }
  async updateKeyframe(id: string, update: Partial<Keyframe>) {
    await db.keyframes.update(id, deflateKeyframe(update))
  }
  async deleteKeyframe(id: string): Promise<void> {
    await db.keyframes.delete(id)
  }
  list(): Promise<Id[]> {
    return db.documents.toCollection().primaryKeys()
  }
  get(docId: string): Promise<Document> {
    return db.transaction("readonly", [db.keyframes, db.documents], async () => {
      const doc = await getExisting(db.documents, docId)
      const keyframes = await Promise.all(
        doc.keyframes.map(id => getExisting(db.keyframes, id).then(inflateKeyframe))
      )
      return {
        ...doc,
        keyframes
      }
    })
  }
  save(doc: Document): Promise<void> {
    return db.transaction(
      "rw",
      [db.keyframes, db.documents],
      () =>
        void Promise.all(
          doc.keyframes.map(keyframe => {
            db.keyframes.put(deflateKeyframe(keyframe))
          })
        ).then(() =>
          db.documents.put({
            ...doc,
            keyframes: doc.keyframes.map(({ id }) => id)
          })
        )
    )
  }
}

function getExisting<T>(table: Table<T>, id: string): Promise<T> {
  return table.get(id).then(doc => {
    if (!doc) throw Error(`No doc found with id ${id}`)
    return doc
  })
}

function deflateKeyframe(k: Partial<Keyframe>): any {
  k = { ...k }
  if (k.state) {
    k.state = deflate(k.state)
  }
  return k
}

function inflateKeyframe(k: Keyframe): Keyframe {
  k = { ...k }
  if (k.state) {
    k.state = inflate(k.state)
  }
  return k
}
