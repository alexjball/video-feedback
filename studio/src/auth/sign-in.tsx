import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth"
import { auth } from "../firebase"
import { GoogleAuthProvider } from "firebase/auth"
import styled from "styled-components"

const uiConfig: firebaseui.auth.Config = {
  signInFlow: "popup",
  signInSuccessUrl: "/",
  signInOptions: [GoogleAuthProvider.PROVIDER_ID]
}

const Container = styled.div`
  max-width: 150px;
`

function SignInScreen() {
  return (
    <Container>
      <h1>My App</h1>
      <p>Please sign-in:</p>
      <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />
    </Container>
  )
}

export default SignInScreen
