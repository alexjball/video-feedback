import { nanoid } from "nanoid"
import { Modify } from "../utils"
import db, { getExisting, BaseTable } from "./core"
import keyframes, { deflateKeyframe, JsonKeyframe, Keyframe } from "./keyframes"

export type Id = string

export interface Document {
  id: Id
  name?: string
  // version: number
  keyframes: Keyframe[]
}

export type DbDocument = Modify<Document, { keyframes: Id[] }>
export type JsonDocument = Modify<Document, { keyframes: JsonKeyframe[] }>

const docTables = [db.documents, db.keyframes, db.images]
export class Documents extends BaseTable<DbDocument, Document> {
  async create(id = nanoid()): Promise<Document> {
    await this.table.add({
      id,
      keyframes: []
    })
    return this.get(id)
  }
  get(docId: string): Promise<Document> {
    return db.transaction("readonly", docTables, async () => {
      const doc = await getExisting(this.table, docId)
      const frames = await Promise.all(doc.keyframes.map(id => keyframes.get(id)))
      return {
        ...doc,
        keyframes: frames
      }
    })
  }
  async update(doc: Document | DbDocument) {
    await db.transaction("rw", docTables, () =>
      this.table.put({
        ...doc,
        keyframes: doc.keyframes.map(k => (typeof k === "object" ? k.id : k))
      })
    )
  }
  async put(doc: Document) {
    await db.transaction("rw", docTables, async () => {
      await Promise.all(doc.keyframes.map(k => keyframes.put(k)))
      await this.table.put({
        ...doc,
        keyframes: doc.keyframes.map(k => k.id)
      })
    })
  }
}

export default new Documents(db.documents)

export function toJson(document: Document): JsonDocument {
  return {
    ...document,
    keyframes: document.keyframes.map(deflateKeyframe)
  }
}
