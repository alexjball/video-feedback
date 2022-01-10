/**
 * Pane to control playback, recording, and saving, and loading.
 *
 * Maybe a timeline view?
 *
 * Save feedback configurations and small screenshots
 *
 * Make control view more of a parameter monitor. Allow user to freely map
 * parameters to interactions. Monitor hides by default, and the user can pin
 * parameter UI. Parameter UI appears during controlling interactions.
 *
 * Build saving and timeline in io, state monitor in control, and interaction configuration in navigation
 */
// https://github.com/atlassian/react-beautiful-dnd/blob/master/stories/src/horizontal/author-app.jsx
// https://github.com/atlassian/react-beautiful-dnd/blob/master/stories/src/primatives/author-list.jsx

import { useCallback, useMemo } from "react"
import { DragDropContext, Draggable, Droppable, DropResult } from "react-beautiful-dnd"
import styled from "styled-components"
import { useAppDispatch, useAppSelector } from "../hooks"
import * as simulation from "../simulation"
import { isDefined } from "../utils"
import { addKeyframe, deleteKeyframe, undoKeyframe, snapshotKeyframe } from "./actions"
import { useService } from "./service"
import * as model from "./model"
import { faCheck, faTrash, faUndo, faPlus } from "@fortawesome/free-solid-svg-icons"
import { common } from "../ui"

export default function IoPanel(props: any) {
  const selection = useSelectionState()
  return (
    <Io {...props}>
      <Playlist selection={selection} />
      {!selection.viewOnly && <Controls selection={selection} />}
    </Io>
  )
}

const Io = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: end;
    align-items: center;
    opacity: 0.8;
    user-select: none;
    margin-bottom: 0.5rem;

    :hover {
      opacity: 1;
    }
  `,
  IconButton = styled(common.IconButton)`
    margin: 0.5rem;
    margin-bottom: 0;
  `,
  KeyframeContainer = styled.img<{ selected: boolean; modified: boolean }>`
    max-height: 150px;
    max-width: 150px;
    border: solid;
    border-color: ${({ selected, modified }) =>
      selected ? (modified ? "#fffb26" : "#62ff62") : "#000000"};
    object-fit: contain;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    margin-right: 0.5rem;
    margin-left: 0.5rem;
  `,
  Keyframe: React.FC<{
    index: number
    keyframe: model.Keyframe
    onClick: (k: model.Keyframe) => void
    selected?: boolean
    modified?: boolean
    dragDisabled?: boolean
  }> = ({ onClick, index, keyframe, selected = false, modified = false, dragDisabled = false }) => (
    <Draggable isDragDisabled={dragDisabled} draggableId={keyframe.id} index={index}>
      {provided => (
        <KeyframeContainer
          selected={selected}
          modified={modified}
          onClick={() => onClick(keyframe)}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          src={keyframe.thumbnail}
        />
      )}
    </Draggable>
  ),
  PlaylistContainer = styled.div`
    display: flex;
    max-width: 800px;
    align-items: center;
    pointer-events: all;
    overflow: auto;
  `,
  Playlist: React.FC<{ selection: SelectionState }> = ({ selection: state }) => {
    const playlist = useAppSelector(s => s.io.keyframes)
    const selection = useAppSelector(s => s.io.selection)
    const onDragEnd = useCallback(
      (result: DropResult) => {
        if (result.destination && result.destination.index !== result.source.index) {
          state.move(result.draggableId, result.destination.index)
        }
      },
      [state]
    )

    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable direction="horizontal" droppableId="droppable-1">
          {provided => (
            <PlaylistContainer ref={provided.innerRef} {...provided.droppableProps}>
              {playlist.map((k, i) => (
                <Keyframe
                  keyframe={k}
                  index={i}
                  key={k.id}
                  selected={selection.keyframeId === k.id}
                  modified={!state.viewOnly && selection.modified}
                  onClick={state.select}
                  dragDisabled={state.viewOnly}
                />
              ))}
              {provided.placeholder}
            </PlaylistContainer>
          )}
        </Droppable>
      </DragDropContext>
    )
  },
  Controls: React.FC<{ selection: SelectionState }> = ({ selection }) => {
    return (
      <div style={{ display: "flex" }}>
        <IconButton {...selection.update} icon={faCheck} />
        <IconButton {...selection.undo} icon={faUndo} />
        <IconButton {...selection.add} icon={faPlus} />
        <IconButton {...selection.delete} icon={faTrash} />
      </div>
    )
  }

function useSelectionState() {
  const dispatch = useAppDispatch(),
    simulationService = simulation.useService(),
    ioService = useService(),
    selection = useAppSelector(s => s.io.selection),
    viewOnly = useAppSelector(s => s.studio.mode === "view"),
    hasSelection = isDefined(selection.keyframeId),
    isModified = hasSelection && selection.modified

  return useMemo(() => {
    const services: any = { simulation: simulationService, io: ioService },
      hasServices = services.simulation && services.io
    return {
      add: {
        disabled: viewOnly,
        onClick: () => hasServices && dispatch(addKeyframe(services))
      },
      undo: {
        disabled: viewOnly || !isModified,
        onClick: () => dispatch(undoKeyframe())
      },
      update: {
        disabled: viewOnly || !isModified,
        onClick: () => hasServices && dispatch(snapshotKeyframe(services))
      },
      delete: {
        disabled: viewOnly || !hasSelection || isModified,
        onClick: () => dispatch(deleteKeyframe())
      },
      select: (k: model.Keyframe) =>
        (viewOnly || !isModified) && dispatch(model.selectKeyframe(k.id)),
      move: (id: string, index: number) => !viewOnly && dispatch(model.moveKeyframe({ id, index })),
      viewOnly
    }
  }, [dispatch, hasSelection, ioService, isModified, simulationService, viewOnly])
}

type SelectionState = ReturnType<typeof useSelectionState>
