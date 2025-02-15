import { nanoid } from "nanoid"
import { Modify } from "../utils"
import db, { BaseTable, getExisting } from "./core"
import keyframes, { deflateKeyframe, JsonKeyframe, Keyframe } from "./keyframes"

export type Id = string

export interface Document {
  id: Id
  createdAt?: Date
  updatedAt?: Date
  // If basedOn is set, this document is a fork of another
  basedOn?: Id
  name?: string
  // version: number
  keyframes: Keyframe[]
}

export type DbDocument = Modify<Document, { keyframes: Id[] }>
export type JsonDocument = Modify<Document, { keyframes: JsonKeyframe[] }>

const docTables = [db.documents, db.keyframes, db.images]
export class Documents extends BaseTable<DbDocument, Document> {
  async create(input?: Id | Document): Promise<Document> {
    let data: Document
    if (typeof input === "string") {
      data = { id: input, keyframes: [] }
    } else if (input === undefined) {
      data = { id: nanoid(), keyframes: [] }
    } else {
      data = input
    }
    const createdAt = new Date()

    const keyframeIds: Id[] = await Promise.all(
      data.keyframes.map(k =>
        keyframes.create(k.state, k.thumbnail.blob, k.basedOn).then(k => k.id)
      )
    )
    const id = await this.table.add({
      ...data,
      createdAt,
      updatedAt: createdAt,
      keyframes: keyframeIds
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

  async update(doc: Partial<Document | DbDocument>) {
    const { id, keyframes, ...rest } = doc
    let update: Record<string, any> = rest

    if (!id) throw Error("Document must have an id")
    if (keyframes) {
      const dbKeyframes = keyframes.map(k => (typeof k === "object" ? k.id : k))
      update.keyframes = dbKeyframes
    }
    update.updatedAt = new Date()
    await this.table.update(id, update)
  }

  /** Put a document, used when syncing from the cloud. */
  async put(doc: DbDocument) {
    console.debug("putting document", doc)
    await this.table.put(doc)
  }
}

export default new Documents(db.documents)

export function toJson(document: Document): JsonDocument {
  return {
    ...document,
    keyframes: document.keyframes.map(deflateKeyframe)
  }
}
