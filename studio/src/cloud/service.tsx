import { useEffect, useMemo } from "react"
import { auth } from "../firebase"
import { useAppDispatch } from "../hooks"
import { createService } from "../utils"
import { setUser } from "./model"

export const { Provider } = createService(useAuthState)

function useAuthState() {
  const dispatch = useAppDispatch()
  useEffect(() => auth.onAuthStateChanged(user => dispatch(setUser(user?.uid ?? null))), [dispatch])
}
