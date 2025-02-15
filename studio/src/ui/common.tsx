import { IconDefinition } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { forwardRef } from "react"
import { ButtonProps } from "react-bootstrap/Button"
import { OverlayChildren } from "react-bootstrap/esm/Overlay"
import { OverlayTriggerType } from "react-bootstrap/esm/OverlayTrigger"
import styled from "styled-components"
import * as bootstrap from "./bootstrap"

export const Button = styled(bootstrap.Button)`
  pointer-events: all;
`

interface IconProps extends ButtonProps {
  icon: IconDefinition
}
export const IconButton = forwardRef<HTMLButtonElement, IconProps>(function IconButton(
  { children, icon, ...props },
  ref
) {
  return (
    <Button ref={ref} {...props}>
      <FontAwesomeIcon icon={icon} size={"lg"} />
      {children && <span style={{ marginLeft: "0.5rem" }}>{children}</span>}
    </Button>
  )
})

export interface TooltipProps extends IconProps {
  tooltip: string | OverlayChildren
  showTooltip?: boolean
  defaultShow?: boolean
  trigger?: OverlayTriggerType | OverlayTriggerType[]
  overlay?: string | OverlayChildren
  onToggle?: (nextShow: boolean) => void
  placement?: "top" | "bottom" | "left" | "right"
}
export const TooltipButton = forwardRef<HTMLButtonElement, TooltipProps>(function TooltipButton(
  {
    className,
    tooltip,
    showTooltip,
    onToggle,
    defaultShow,
    trigger,
    overlay,
    placement = "bottom",
    ...props
  },
  ref
) {
  return (
    <bootstrap.OverlayTrigger
      placement={placement}
      trigger={trigger ?? ["focus", "hover"]}
      defaultShow={defaultShow}
      show={showTooltip}
      onToggle={onToggle}
      overlay={
        typeof tooltip === "string" ? <bootstrap.Tooltip>{tooltip}</bootstrap.Tooltip> : tooltip
      }>
      <div className={className} style={{ pointerEvents: "all" }}>
        <IconButton ref={ref} {...props} />
      </div>
    </bootstrap.OverlayTrigger>
  )
})
