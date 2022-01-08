import { GoogleAuthProvider } from "firebase/auth"
import styled from "styled-components"
import { useMemo } from "react"
import { bootstrap, common } from "../ui"
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth"
import { auth } from "../firebase"
import { useAppSelector } from "../hooks"

const Auth = styled(StyledFirebaseAuth)`
    min-height: 50px;
  `,
  Button = styled(common.Button)`
    min-width: 5rem;
  `,
  Popover = styled(bootstrap.Popover)`
    pointer-events: all;
  `,
  PopoverBody = styled(bootstrap.Popover.Body)`
    padding: 0;
  `

export function Account() {
  const authenticated = useAppSelector(s => !!s.cloud.uid)
  return authenticated ? <Logout /> : <Login />
}

function Logout() {
  return (
    <Button
      onClick={() =>
        auth
          .signOut()
          .then(() => console.log("Sign out success"))
          .catch(e => console.warn("Sign out failure", e))
      }>
      Sign out
    </Button>
  )
}

function Login() {
  const uiConfig: firebaseui.auth.Config = useMemo(
    () => ({
      signInFlow: "popup",
      callbacks: {
        signInSuccessWithAuthResult: result => (console.log("Sign in success", result), false),
        signInFailure: error => void console.warn("Sign in failure", error)
      },
      signInOptions: [GoogleAuthProvider.PROVIDER_ID]
    }),
    []
  )

  const popover = (
    <Popover>
      <Popover.Header as="h3">Sign in to publish your work</Popover.Header>
      <PopoverBody>
        <Auth uiConfig={uiConfig} firebaseAuth={auth} />
      </PopoverBody>
    </Popover>
  )

  return (
    <bootstrap.OverlayTrigger trigger="click" placement="bottom" overlay={popover}>
      <Button>Sign In</Button>
    </bootstrap.OverlayTrigger>
  )
}
