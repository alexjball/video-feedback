import React from "react"
import styled from "styled-components"
import { useAppSelector } from "./hooks"
import { Coords } from "./simulation/model"

type Corner = "NE" | "SE" | "NW" | "SW"

const Legend = styled.svg`
    border: 3px solid black;
    border-radius: 5px;
    transform: scaleY(-1);

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
    return (
      <>
        <defs>
          <mask id="outsideRectangle">
            <rect fill="white" x="-50%" y="-50%" width="100%" height="100%" />
            <CenteredRect strokeWidth={0} width={width} height={height} fill="black" />
          </mask>
        </defs>
        <CenteredRect
          strokeWidth={2 * borderWidth}
          stroke={color}
          mask="url(#outsideRectangle)"
          rx={0.01}
          ry={0.01}
          width={width}
          height={height}
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
      cx = corner.includes("W") ? -halfW : halfW,
      cy = corner.includes("S") ? -halfH : halfH

    const label = `${mirrorY ? "S" : corner[0]}${mirrorX ? "W" : corner[1]}`,
      flipX = mirrorX && corner.includes("E"),
      flipY = mirrorY && corner.includes("N")
    return (
      <g display={(flipX || flipY) && hideOnMirror ? "none" : undefined} fillOpacity={0.4}>
        <rect x={cx - halfW} y={cy - halfH} width={width} height={height} fill={color} />
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
      {(["NW", "NE", "SE", "SW"] as const).map((c, i) => (
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
      {(["NW", "NE", "SE", "SW"] as const).map((c, i) => (
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
    </Legend>
  )
}
