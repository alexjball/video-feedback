import { nanoid } from "nanoid"
import { Modify } from "../utils"
import db, { getExisting, BaseTable } from "./core"
import keyframes, { Keyframe } from "./keyframes"

export type Id = string

export interface Document {
  id: Id
  name?: string
  // version: number
  keyframes: Keyframe[]
}

export type DbDocument = Modify<Document, { keyframes: Id[] }>

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
}

export default new Documents(db.documents)
