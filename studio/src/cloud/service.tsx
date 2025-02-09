import { Transaction } from "dexie"
import { onSnapshot, query } from "firebase/firestore"
import { useEffect } from "react"
import { unpublishDocument } from "."
import db from "../db"
import { auth } from "../firebase"
import { useAppDispatch } from "../hooks"
import { createService } from "../utils"
import { loadCloudDocument, paths, performInitialSyncToCloud, publishDocument } from "./actions"
import { CloudDocument, localUpToDate, setUser, useSyncInfo, useUid } from "./model"

export const { Provider } = createService(() => {
  useAuthState()
  useSyncCloudToLocal()
  useSyncLocalToCloud()
})

function useAuthState() {
  const dispatch = useAppDispatch()
  useEffect(() => auth.onAuthStateChanged(user => dispatch(setUser(user?.uid ?? null))), [dispatch])
}

/** Sync the user's cloud documents to the local database.
 *
 * - Set up a listener on the user's public documents.
 * - For each firestore document, convert it to a database document and put it
 *   in the local database.
 */
function useSyncCloudToLocal() {
  const uid = useUid()
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (!uid) return
    const unsubscribe = onSnapshot(
      query(paths.publicDocsForUser(uid)),
      { includeMetadataChanges: true },
      async snapshot => {
        const loadAll = snapshot
          .docChanges()
          .filter(d => d.type === "added" || d.type === "modified")
          .map(change => loadCloudDocument({ uid, cloudDoc: change.doc.data() as CloudDocument }))
        await Promise.all(loadAll).catch(error => {
          console.error("Error loading cloud document", error)
        })
        if (!snapshot.metadata.fromCache) {
          // When fromCache is false, we know the client has received all
          // available data from the cloud. After this point, it is safe to
          // start syncing local changes to the cloud.
          console.log("Client has most recent cloud updates")
          dispatch(localUpToDate())
        }
      },
      error => {
        console.error("Error syncing cloud to local", error)
      }
    )
    return unsubscribe
  }, [dispatch, uid])
}

function useSyncLocalToCloud() {
  const { isInitiallySynced, isLocalUpToDate, uid } = useSyncInfo()
  const dispatch = useAppDispatch()

  // Perform initial sync to cloud. This occurs after syncing more recent cloud
  // changes to local. This will publish any local-only documents to the cloud
  // and perform any backfills.
  useEffect(() => {
    if (!uid || !isLocalUpToDate) return
    dispatch(performInitialSyncToCloud())
  }, [dispatch, isLocalUpToDate, uid])

  // Subscribe to database hooks to sync further local changes to the cloud
  useEffect(() => {
    if (!uid || !isInitiallySynced) return
    function onUpdating(m: any, p: string, o: any, t: Transaction) {
      console.log("updating", p)
      t.on("complete", () => {
        console.log("publishing after update", p)
        dispatch(publishDocument(p))
      })
    }
    function onCreating(p: string, o: any, t: Transaction) {
      console.log("creating", p)
      t.on("complete", () => {
        console.log("publishing after create", p)
        dispatch(publishDocument(p))
      })
    }
    function onDeleting(p: string, o: any, t: Transaction) {
      console.log("deleting", p)
      t.on("complete", () => {
        console.log("deleting after delete", p)
        dispatch(unpublishDocument(p))
      })
    }

    db.documents.table.hook("deleting", onDeleting)
    db.documents.table.hook("updating", onUpdating)
    db.documents.table.hook("creating", onCreating)

    console.log("subscribed to hooks")

    return () => {
      db.documents.table.hook("updating").unsubscribe(onUpdating)
      db.documents.table.hook("creating").unsubscribe(onCreating)
      db.documents.table.hook("deleting").unsubscribe(onDeleting)
    }
  }, [dispatch, isInitiallySynced, uid])
}
