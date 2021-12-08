import React, { ChangeEventHandler, useCallback } from "react"
import styled from "styled-components"
import { useAppDispatch, useAppSelector } from "./hooks"
import {
  setBackgroundColor,
  setBorderColor,
  setBorderWidth,
  setColorCycle,
  setColorGain,
  setInvertColor,
  setMirrorX,
  setMirrorY,
  setNumberFeedbackFrames,
  setPortal
} from "./simulation/model"
import { RootState } from "./store"

const Form = styled.form`
    display: flex;
    flex-direction: column;
    align-items: end;
    user-select: none;

    /* TODO: remove/improve these scroll props */
    overflow-y: auto;
    pointer-events: auto;
  `,
  Control = styled.div`
    position: relative;
    pointer-events: all;
    background-color: white;
    opacity: 0.8;
    border-radius: 5px;
    box-shadow: 0 0 8px grey;
    margin: 10px;
    padding: 5px;

    :hover {
      opacity: 1;
    }

    input[type="color"] {
      width: 100%;
    }

    select {
      margin-left: 0.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.2rem;
    }

    fieldset {
      border: 2px solid grey;
      border-radius: 5px;
    }
  `

function RangeInput({
  legend,
  value = 0,
  min = 0,
  max = 1,
  step = 0.01,
  onChange = () => {}
}: {
  legend?: string
  value?: number
  min?: number
  max?: number
  step?: number
  onChange?: (v: number) => void
}) {
  const update: ChangeEventHandler<HTMLInputElement> = useCallback(
    e => onChange(e.target.valueAsNumber),
    [onChange]
  )
  return (
    <Control>
      <fieldset>
        <legend>{legend}</legend>
        <input type="range" min={min} max={max} value={value} step={step} onChange={update} />
        <input type="number" min={min} max={max} value={value} step={step} onChange={update} />
      </fieldset>
    </Control>
  )
}

function ColorInput({
  legend,
  value = "#ffffff",
  onChange = () => {}
}: {
  legend?: string
  value?: string
  onChange?: (v: string) => void
}) {
  const update: ChangeEventHandler<HTMLInputElement> = useCallback(
    e => onChange(e.target.value),
    [onChange]
  )
  return (
    <Control>
      <fieldset>
        <legend>{legend}</legend>
        <input type="color" value={value} onInput={update} />
      </fieldset>
    </Control>
  )
}

function ToggleInput({
  legend,
  value = false,
  onChange = () => {}
}: {
  legend?: string
  value?: boolean
  onChange?: (v: boolean) => void
}) {
  const update: ChangeEventHandler<HTMLInputElement> = useCallback(
    e => onChange(e.target.checked),
    [onChange]
  )
  return (
    <Control>
      <fieldset>
        <legend>{legend}</legend>
        <input type="checkbox" checked={value} onChange={update} />
      </fieldset>
    </Control>
  )
}

const config: ControlConfig[] = [
  {
    Component: ColorInput,
    selector: s => s.simulation.background.color,
    actionCreator: v => setBackgroundColor(v),
    props: {
      legend: "background color"
    }
  },
  {
    Component: ColorInput,
    selector: s => s.simulation.border.color,
    actionCreator: v => setBorderColor(v),
    props: {
      legend: "border color"
    }
  },
  {
    Component: RangeInput,
    selector: s => s.simulation.border.width,
    actionCreator: v => setBorderWidth(v),
    props: {
      legend: "border width"
    }
  },
  {
    Component: RangeInput,
    selector: s => s.simulation.feedback.colorGain,
    actionCreator: v => setColorGain(v),
    props: {
      legend: "color gain",
      min: 0,
      max: 1,
      step: 0.01
    }
  },
  {
    Component: RangeInput,
    selector: s => s.simulation.feedback.colorCycle,
    actionCreator: v => setColorCycle(v),
    props: {
      legend: "color cycle",
      min: 0,
      max: 1,
      step: 0.01
    }
  },
  {
    Component: ToggleInput,
    selector: s => s.simulation.feedback.invertColor,
    actionCreator: v => setInvertColor(v),
    props: {
      legend: "invert color"
    }
  },
  {
    Component: ToggleInput,
    selector: s => s.simulation.spacemap.mirrorY,
    actionCreator: v => setMirrorY(v),
    props: {
      legend: "mirror Y"
    }
  },
  {
    Component: ToggleInput,
    selector: s => s.simulation.spacemap.mirrorX,
    actionCreator: v => setMirrorX(v),
    props: {
      legend: "mirror X"
    }
  },
  {
    Component: RangeInput,
    selector: s => s.simulation.feedback.nFrames,
    actionCreator: v => setNumberFeedbackFrames(v),
    props: {
      legend: "num. feedback frames",
      min: 1,
      max: 30,
      step: 1
    }
  }
]

const controls = config.map(createControl)
interface ControlConfig {
  selector: (s: RootState) => any
  actionCreator: (v: any) => any
  Component: React.FC<any>
  props: any
}

function createControl({ selector, actionCreator, Component, props }: ControlConfig) {
  return function Control() {
    const dispatch = useAppDispatch()
    const v = useAppSelector(selector)
    const onChange = useCallback(v => dispatch(actionCreator(v)), [dispatch])
    return <Component value={v} onChange={onChange} {...props} />
  }
}

export const ControlsPanel = (props: any) => (
  <Form onSubmit={e => void console.log(e)} {...props}>
    {controls.map((C, i) => (
      <C key={i} />
    ))}
    <ResolutionControls />
  </Form>
)

function ResolutionControls() {
  const dispatch = useAppDispatch()
  const setHeight: React.ChangeEventHandler<HTMLSelectElement> = useCallback(
    e => {
      const height = parseInt(e.target.value)
      dispatch(setPortal({ height }))
    },
    [dispatch]
  )
  const setAspect: React.ChangeEventHandler<HTMLSelectElement> = useCallback(
    e => {
      const aspect = parseFloat(e.target.value)
      dispatch(setPortal({ aspect }))
    },
    [dispatch]
  )
  return (
    <Control>
      <fieldset>
        <legend>portal resolution</legend>

        <label>
          height
          <select onChange={setHeight}>
            {/* <option value={0}>screen</option> */}
            <option value={720}>720p</option>
            <option value={1080}>1080p</option>
            <option value={1440}>1440p</option>
            <option value={2160}>4K</option>
          </select>
        </label>

        <label>
          aspect ratio
          <select onChange={setAspect}>
            {/* <option value={0}>screen</option> */}
            <option value={1}>1:1</option>
            <option value={4 / 3}>4:3</option>
            <option value={16 / 9}>16:9</option>
          </select>
        </label>
      </fieldset>
    </Control>
  )
}
