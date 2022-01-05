import core from "./core"
import * as documents from "./documents"
import * as keyframes from "./keyframes"
import * as images from "./images"

const db = {
  core,
  documents: documents.default,
  keyframes: keyframes.default,
  images: images.default
}

export default db
export { documents, keyframes, images }
