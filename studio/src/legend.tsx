import React from "react"
import styled from "styled-components"
import { useAppSelector } from "./hooks"
import { Coords } from "./simulation/model"

/**
 * Renders the simulation model using SVG.
 *
 * The legend uses the same frame as the simulation for convenience of
 * calculation.
 */
export function LegendPanel(props: any) {
  const state = useAppSelector(s => s.simulation)
  return (
    <Legend viewBox="-1.5 -1.5 3 3" {...props}>
      <Destination
        color="#ff0000"
        portal={state.portal.coords}
        borderWidth={state.border.width}
        mirrorX={state.spacemap.mirrorX}
        mirrorY={state.spacemap.mirrorY}
      />
      <Source
        color="#00ff00"
        portal={state.portal.coords}
        spacemap={state.spacemap.coords}
        mirrorX={state.spacemap.mirrorX}
        mirrorY={state.spacemap.mirrorY}
      />
      <Viewer coords={state.viewer.coords} />
    </Legend>
  )
}

type Corner = "UR" | "LR" | "UL" | "LL"
const corners = ["UR", "LR", "UL", "LL"] as Corner[]

const Legend = styled.svg`
    /* border: 3px solid black; */
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    margin: 20px;
    box-shadow: 0 0 10px 10px rgba(255, 255, 255, 0.3);
    transform: scaleY(-1);
    user-select: none;

    text {
      transform: scaleY(-1);
    }
  `,
  CenteredRect = styled.rect`
    x: ${p => p.x ?? (p.width as number) * -0.5};
    y: ${p => p.y ?? (p.height as number) * -0.5};
  `,
  Border: React.FC<{ borderWidth: number; color: string; width: number; height: number }> = ({
    borderWidth,
    color,
    width,
    height
  }) => {
    const borderOffset = borderWidth > 0 ? 2 * borderWidth : -0.01
    return (
      <>
        <defs>
          <mask id="outsideRectangle">
            <rect fill="white" x="-50%" y="-50%" width="100%" height="100%" />
            <CenteredRect strokeWidth={0} width={width} height={height} fill="black" />
          </mask>
        </defs>
        <CenteredRect
          fill={color}
          mask="url(#outsideRectangle)"
          rx={borderWidth > 0.05 ? 0.1 : 0}
          width={width + borderOffset}
          height={height + borderOffset}
        />
      </>
    )
  },
  LineOfSymmetry: React.FC<{ radius: number; mirrorX?: boolean; mirrorY?: boolean }> = ({
    mirrorX,
    mirrorY,
    radius
  }) => (
    <line
      x1={mirrorY !== undefined ? -radius : 0}
      x2={mirrorY !== undefined ? radius : 0}
      y1={mirrorX !== undefined ? -radius : 0}
      y2={mirrorX !== undefined ? radius : 0}
      stroke={mirrorX || mirrorY ? "#517fff" : "#5e5e5e"}
      strokeDasharray="0.1 .05"
      strokeWidth={0.05}
      strokeOpacity={mirrorX ? 1 : 0.5}
    />
  ),
  Viewer: React.FC<{ coords: Coords }> = ({ coords }) => (
    <CenteredRect
      width={coords.scale.x}
      height={coords.scale.y}
      stroke={"#81f89e"}
      strokeDasharray="0.1 .05"
      strokeWidth={0.02}
      fill="none"
    />
  ),
  Quadrant: React.FC<{
    corner: Corner
    parentWidth: number
    parentHeight: number
    color: string
    hideOnMirror?: boolean
    mirrorX?: boolean
    mirrorY?: boolean
  }> = ({
    corner,
    parentWidth,
    parentHeight,
    hideOnMirror = false,
    mirrorX = false,
    mirrorY = false,
    color
  }) => {
    const width = parentWidth * 0.5,
      height = parentHeight * 0.5,
      halfW = width / 2,
      halfH = height / 2,
      lower = corner[0] === "L",
      left = corner[1] === "L",
      cx = left ? -halfW : halfW,
      cy = lower ? -halfH : halfH

    const label = `${mirrorY ? "L" : corner[0]}${mirrorX ? "L" : corner[1]}`,
      flipX = mirrorX && !left,
      flipY = mirrorY && !lower,
      flip = flipX || flipY
    return (
      <g display={flip && hideOnMirror ? "none" : undefined} fillOpacity={flip ? 0.4 : 0.4}>
        <rect
          x={cx - halfW}
          y={cy - halfH}
          width={width}
          height={height}
          fill={flip ? "#517fff" : color}
        />
        <g
          transform={`
            translate(${cx}, ${cy})
            scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})
          `}>
          <text
            fontSize={0.3}
            fontFamily={"monospace"}
            textAnchor="middle"
            dominantBaseline="middle">
            {label}
          </text>
        </g>
      </g>
    )
  }

function Destination({
  portal,
  borderWidth,
  color,
  mirrorX,
  mirrorY
}: {
  portal: Coords
  borderWidth: number
  color: string
  mirrorX: boolean
  mirrorY: boolean
}) {
  const width = portal.scale.x,
    height = portal.scale.y
  return (
    <g>
      <Border color={color} borderWidth={borderWidth} width={width} height={height} />
      {corners.map((c, i) => (
        <Quadrant
          key={i}
          corner={c}
          color={color}
          parentHeight={height}
          parentWidth={width}
          mirrorX={mirrorX}
          mirrorY={mirrorY}
        />
      ))}
      <LineOfSymmetry radius={height} mirrorX={mirrorX} />
      <LineOfSymmetry radius={width} mirrorY={mirrorY} />
    </g>
  )
}

function Source({
  spacemap,
  portal,
  color,
  mirrorX,
  mirrorY
}: {
  spacemap: Coords
  portal: Coords
  color: string
  mirrorX: boolean
  mirrorY: boolean
}) {
  const degRad = 180 / Math.PI,
    rotationAngle =
      Math.acos(spacemap.quaternion.w) * 2 * degRad * Math.sign(spacemap.quaternion.z),
    width = portal.scale.x,
    height = portal.scale.y

  return (
    <g
      transform={`
        translate(${spacemap.position.x} ${spacemap.position.y})
        rotate(${rotationAngle})
        scale(${spacemap.scale.x} ${spacemap.scale.y})
      `}>
      {corners.map((c, i) => (
        <Quadrant
          key={i}
          corner={c}
          hideOnMirror={true}
          color={color}
          parentHeight={height}
          parentWidth={width}
          mirrorX={mirrorX}
          mirrorY={mirrorY}
        />
      ))}
    </g>
  )
}
