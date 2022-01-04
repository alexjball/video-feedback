import Dexie, { Table } from "dexie"
import type * as documents from "./documents"

export class Database extends Dexie {
  documents!: Table<documents.DbDocument, documents.Id>
  keyframes!: Table<documents.Keyframe, documents.Id>

  constructor() {
    super("studio-db")
    this.version(1).stores({
      documents: "id",
      keyframes: "id"
    })
  }
}

export default new Database()
