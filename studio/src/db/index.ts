import core from "./core"
import * as documents from "./documents"

const db = {
  core,
  documents: new documents.Documents()
}

export default db
export { documents }
