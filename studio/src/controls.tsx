import { ChangeEventHandler, useCallback } from "react"
import styled from "styled-components"
import { useAppDispatch, useAppSelector } from "./hooks"
import { setBackgroundColor, setBorderColor, setBorderWidth } from "./simulation/model"

const Form = styled.form`
    display: flex;
    flex-direction: column;
    align-items: end;
    user-select: none;
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

export const ControlsPanel = (props: any) => (
  <Form onSubmit={e => void console.log(e)} {...props}>
    <BackgroundColor />
    <BorderColor />
    <BorderWidth />
  </Form>
)

function BorderWidth() {
  const dispatch = useAppDispatch()
  const onChange = useCallback(width => dispatch(setBorderWidth(width)), [dispatch])
  const width = useAppSelector(state => state.simulation.border.width)
  return <RangeInput legend="border width" value={width} onChange={onChange} />
}

function BackgroundColor() {
  const dispatch = useAppDispatch()
  const onChange = useCallback(color => dispatch(setBackgroundColor(color)), [dispatch])
  const v = useAppSelector(state => state.simulation.background.color)
  return <ColorInput legend="background color" value={v} onChange={onChange} />
}

function BorderColor() {
  const dispatch = useAppDispatch()
  const onChange = useCallback(color => dispatch(setBorderColor(color)), [dispatch])
  const v = useAppSelector(state => state.simulation.border.color)
  return <ColorInput legend="border color" value={v} onChange={onChange} />
}
