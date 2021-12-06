import styled from "styled-components"
import { useAppSelector } from "./hooks"
import { Coords } from "./simulation/model"

const Legend = styled.svg`
    border: 3px solid black;
    border-radius: 5px;
    transform: scaleY(-1);
  `,
  Region = styled.rect`
    rx: 0.01;
    ry: 0.01;
    fill: ${props => props.color};
    fill-opacity: 0.4;
    stroke: ${props => props.color};
  `

function Destination({
  portal,
  borderWidth,
  color
}: {
  portal: Coords
  borderWidth: number
  color: string
}) {
  const width = portal.scale.x + borderWidth,
    height = portal.scale.y + borderWidth,
    x = width * -0.5,
    y = height * -0.5
  return (
    <Region color={color} strokeWidth={borderWidth} width={width} height={height} x={x} y={y} />
  )
}

function Source({ spacemap, portal, color }: { spacemap: Coords; portal: Coords; color: string }) {
  const width = portal.scale.x,
    height = portal.scale.y,
    x = width * -0.5,
    y = height * -0.5,
    rotationAngle =
      ((Math.acos(spacemap.quaternion.w) * 2 * 180) / Math.PI) * Math.sign(spacemap.quaternion.z)

  return (
    <Region
      width={width}
      height={height}
      x={x}
      y={y}
      strokeWidth={0}
      color={color}
      transform={`
        translate(${spacemap.position.x} ${spacemap.position.y})
        rotate(${rotationAngle})
        scale(${spacemap.scale.x} ${spacemap.scale.y})
      `}
    />
  )
}

/**
 * Renders the simulation model using SVG.
 *
 * The legend uses the same frame as the simulation for convenience of
 * calculation.
 */
export function LegendPanel(props: any) {
  const state = useAppSelector(s => s.simulation)
  return (
    <Legend viewBox="-2 -2 4 4" {...props}>
      <Destination color="#ff0000" portal={state.portal.coords} borderWidth={state.border.width} />
      <Source color="#00ff00" portal={state.portal.coords} spacemap={state.spacemap.coords} />
    </Legend>
  )
}
