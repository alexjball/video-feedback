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
import useIo from "./io-hooks"
import * as model from "./model"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck, faTrash, faUndo, faPlus } from "@fortawesome/free-solid-svg-icons"
import { common } from "../ui"

export default function IoPanel(props: any) {
  useIo()
  const selection = useSelectionState()
  return (
    <Io {...props}>
      <Playlist selection={selection} />
      <Controls selection={selection} />
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

    :hover {
      opacity: 1;
    }
  `,
  IconButton = styled(common.IconButton)`
    margin: 0.5rem;
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
  }> = ({ onClick, index, keyframe, selected = false, modified = false }) => (
    <Draggable draggableId={keyframe.id} index={index}>
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
  Playlist: React.FC<{ selection: SelectionState }> = ({ selection: cb }) => {
    const playlist = useAppSelector(s => s.io.keyframes)
    const selection = useAppSelector(s => s.io.selection)
    const dispatch = useAppDispatch()
    const onDragEnd = useCallback(
      (result: DropResult) => {
        if (result.destination && result.destination.index !== result.source.index) {
          dispatch(model.moveKeyframe({ id: result.draggableId, index: result.destination.index }))
        }
      },
      [dispatch]
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
                  modified={selection.modified}
                  onClick={cb.select.onClick}
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
    service = simulation.useService(),
    selection = useAppSelector(s => s.io.selection),
    hasSelection = isDefined(selection.keyframeId),
    isModified = hasSelection && selection.modified

  return useMemo(
    () => ({
      add: {
        onClick: () => service && dispatch(addKeyframe(service))
      },
      undo: {
        disabled: !isModified,
        onClick: () => dispatch(undoKeyframe())
      },
      update: {
        disabled: !isModified,
        onClick: () => service && dispatch(snapshotKeyframe(service))
      },
      delete: {
        disabled: !hasSelection || isModified,
        onClick: () => dispatch(deleteKeyframe())
      },
      select: {
        onClick: (k: model.Keyframe) => !isModified && dispatch(model.selectKeyframe(k.id))
      }
    }),
    [dispatch, hasSelection, isModified, service]
  )
}

type SelectionState = ReturnType<typeof useSelectionState>
