import { IconDefinition } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { ButtonProps } from "react-bootstrap/Button"
import styled from "styled-components"
import * as bootstrap from "./bootstrap"

export const Button = styled(bootstrap.Button)`
  pointer-events: all;
`

export const IconButton: React.FC<ButtonProps & { icon: IconDefinition }> = ({
  children,
  icon,
  ...props
}) => {
  return (
    <Button {...props}>
      <FontAwesomeIcon icon={icon} size={"lg"} />
      {children && <span style={{ marginLeft: "0.5rem" }}>{children}</span>}
    </Button>
  )
}
