import Dexie, { Table } from "dexie"
import type * as documents from "./documents"
import type * as keyframes from "./keyframes"
import type * as images from "./images"

export class Database extends Dexie {
  documents!: Table<documents.DbDocument, Id>
  keyframes!: Table<keyframes.DbKeyframe, Id>
  images!: Table<images.Image, Id>

  constructor() {
    super("studio-db")
    this.version(1).stores({
      documents: "id",
      keyframes: "id"
    })
    this.version(2).stores({
      images: "id"
    })
  }
}

const db = new Database()
export default db

export function getExisting<T>(table: Table<T>, id: string): Promise<T> {
  return table.get(id).then(doc => {
    if (!doc) throw Error(`No doc found with id ${id}`)
    return doc
  })
}

export type Id = string

export abstract class BaseTable<DbT, OrmT> {
  table: Table<DbT, Id>
  constructor(table: Table<DbT, Id>) {
    this.table = table
  }

  list(): Promise<Id[]> {
    return this.table.toCollection().primaryKeys()
  }
  async exists(...ids: string[]): Promise<boolean> {
    const expected = ids.length,
      count = await this.table
        .where("id")
        .anyOf(ids)
        .limit(expected + 1)
        .count()
    return count === expected
  }
  delete(id: string) {
    return this.table.delete(id)
  }
  abstract get(id: string): Promise<OrmT>
}
