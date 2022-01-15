import React, { ChangeEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react"
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
  setPreventStrobing,
  updatePortal,
  setFeedbackOptions
} from "./simulation/model"
import { AppDispatch, RootState } from "./store"

const Form = styled.div`
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
    background-color: var(--bs-secondary);
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

    select,
    button {
      margin-left: 0.5rem;
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
    actionCreator: v => (dispatch: AppDispatch) => {
      dispatch(setBackgroundColor(v))
      dispatch(setFeedbackOptions({ fsColor1: v }))
    },
    props: {
      legend: "background color"
    }
  },
  {
    Component: ColorInput,
    selector: s => s.simulation.border.color,
    actionCreator: v => (dispatch: AppDispatch) => {
      dispatch(setBorderColor(v))
      dispatch(setFeedbackOptions({ fsColor2: v }))
    },
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
    Component: RangeInput,
    selector: s => s.simulation.feedback.fsPeriod,
    actionCreator: v => setFeedbackOptions({ fsPeriod: v }),
    props: {
      legend: "fixed set period",
      min: 0.01,
      max: 0.3,
      step: 0.001
    }
  },
  {
    Component: RangeInput,
    selector: s => s.simulation.feedback.fsPhase,
    actionCreator: v => setFeedbackOptions({ fsPhase: v }),
    props: {
      legend: "fixed set phase",
      min: -0.5,
      max: 0.5,
      step: 0.001
    }
  },
  {
    Component: RangeInput,
    selector: s => s.simulation.feedback.fsAmplitude,
    actionCreator: v => setFeedbackOptions({ fsAmplitude: v }),
    props: {
      legend: "fixed set amplitude",
      min: 0.1,
      max: 0.5,
      step: 0.001
    }
  },
  {
    Component: RangeInput,
    selector: s => s.simulation.feedback.fsPop,
    actionCreator: v => setFeedbackOptions({ fsPop: v }),
    props: {
      legend: "fixed set pop",
      min: 0,
      max: 1,
      step: 0.001
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
  },
  {
    Component: ToggleInput,
    selector: s => s.simulation.preventStrobing,
    actionCreator: v => setPreventStrobing(v),
    props: {
      legend: "prevent strobing"
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
  <Form {...props}>
    {controls.map((C, i) => (
      <C key={i} />
    ))}
    <ResolutionControls />
  </Form>
)

function ResolutionControls() {
  const dispatch = useAppDispatch(),
    res = useAppSelector(s => s.simulation.feedback.resolution),
    width = res.width,
    aspect = res.height !== 0 ? res.width / res.height : 0,
    cb = useMemo(
      () => ({
        setWidth: (width: number) => {
          if (isNaN(width)) return
          width = Math.round(width)
          if (width >= 3840) {
            // Minimize memory requirements for high resolutions
            dispatch(setNumberFeedbackFrames(1))
          }
          dispatch(updatePortal({ width }))
        },
        setAspect: (aspect: number) => {
          if (isNaN(aspect)) return
          dispatch(updatePortal({ aspect }))
        },
        fitWidth: () => {
          dispatch(updatePortal({ width: window.innerWidth * window.devicePixelRatio }))
        },
        fitAspect: () => {
          dispatch(updatePortal({ aspect: window.innerWidth / window.innerHeight }))
        }
      }),
      [dispatch]
    )

  return (
    <Control>
      <fieldset>
        <legend>Feedback Resolution</legend>

        <NumberWithOptions
          appValue={width}
          setAppValue={cb.setWidth}
          fitToScreen={cb.fitWidth}
          label="Width"
          options={[
            [1280, "720p"],
            [1920, "1080p"],
            [2560, "1440p"],
            [3840, "4K"],
            [7680, "8K"],
            [12288, "12K"],
            [15360, "16K"],
            [15900, "Tapestry"]
          ]}
        />

        <NumberWithOptions
          appValue={aspect}
          setAppValue={cb.setAspect}
          fitToScreen={cb.fitAspect}
          label="Aspect Ratio"
          options={[
            [1, "1:1"],
            [4 / 3, "4:3"],
            [16 / 9, "16:9"],
            [106 / 90, "Tapestry"]
          ]}
        />
      </fieldset>
    </Control>
  )
}

const relativeTolerance = 1e-2,
  different = (a: number, b: number) =>
    Math.abs(a - b) / (Math.abs(a + b) * 0.5) > relativeTolerance

// TODO: add a select field that commits specific values
const NumberWithOptions: React.FC<{
  appValue: number
  setAppValue: (v: number) => void
  options: [number, string][]
  label: string
  fitToScreen: () => void
}> = ({ appValue, setAppValue: doSet, options, label, fitToScreen }) => {
  const [value, setValue] = useState(appValue),
    setAppValue = useCallback(
      (v: number) => {
        if (different(v, appValue)) doSet(v)
      },
      [appValue, doSet]
    ),
    matchingOption = options.find(([v]) => Math.abs(v - appValue) / appValue < relativeTolerance),
    matchingOptionValue = matchingOption?.[0]

  useEffect(() => setValue(appValue), [appValue])

  return (
    <label>
      <div>{label}</div>
      <input
        style={{ maxWidth: "100px" }}
        type="number"
        value={value}
        onChange={e => setValue(Number(e.target.value))}
        onBlur={() => setAppValue(value)}
        onKeyUp={e => {
          if (e.key === "Enter") setAppValue(value)
        }}
      />
      <select
        style={{ maxWidth: "100px" }}
        value={matchingOptionValue ?? appValue}
        onChange={e => setAppValue(Number(e.target.value))}>
        {!matchingOption && <option value={appValue}>--</option>}
        {options.map(([value, label]) => (
          <option value={value} key={label}>
            {label}
          </option>
        ))}
      </select>
      <button style={{ lineHeight: "25px", fontSize: "20px" }} onClick={fitToScreen}>
        🖵
      </button>
    </label>
  )
}
