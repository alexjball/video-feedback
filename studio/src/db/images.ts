import { nanoid } from "nanoid"
import db, { BaseTable, getExisting, Id } from "./core"

export interface Image {
  id: Id
  blob: Blob
}

export class Images extends BaseTable<Image, Image> {
  async create(blob: Blob) {
    const id = await this.table.add({
      id: nanoid(),
      blob
    })
    return this.get(id)
  }
  async update(id: string, blob: Blob) {
    await this.table.update(id, { blob })
  }
  put(image: Image) {
    return this.table.put(image)
  }
  get(id: string): Promise<Image> {
    return getExisting(this.table, id)
  }
}

export default new Images(db.images)
