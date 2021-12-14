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

import { saveAs } from "file-saver"
import { useCallback } from "react"
import { DragDropContext, Draggable, Droppable, DropResult } from "react-beautiful-dnd"
import styled from "styled-components"
import { useAppDispatch, useAppSelector, useAppStore } from "../hooks"
import * as simulation from "../simulation"
import * as model from "./model"

export const IoPanel = (props: any) => (
  <Io {...props}>
    {/* <Playlist /> */}
    <Controls />
  </Io>
)

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
  Button = styled.button`
    pointer-events: all;
    margin: 10px;
  `,
  KeyframeContainer = styled.div`
    height: 100px;
    width: 100px;
    border: solid black;
    border-radius: 50%;
    background: tomato;
    display: flex;
    justify-content: center;
    margin: 0.5rem;
  `,
  Keyframe: React.FC<{ index: number; keyframe: model.Keyframe }> = ({ index, keyframe }) => (
    <Draggable draggableId={keyframe.id} index={index}>
      {provided => (
        <KeyframeContainer
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}>
          {keyframe.name}
        </KeyframeContainer>
      )}
    </Draggable>
  ),
  PlaylistContainer = styled.div`
    display: flex;
    min-width: 100px;
    max-width: 400px;
    min-height: 150px;
    align-items: center;
    pointer-events: all;
    overflow: auto;
  `,
  Playlist = () => {
    const playlist = useAppSelector(s => s.io.playlist)
    const dispatch = useAppDispatch()
    function onDragEnd(result: DropResult) {
      if (result.destination && result.destination.index !== result.source.index) {
        dispatch(model.moveKeyframe({ id: result.draggableId, index: result.destination.index }))
      }
    }

    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable direction="horizontal" droppableId="droppable-1">
          {provided => (
            <PlaylistContainer ref={provided.innerRef} {...provided.droppableProps}>
              {playlist.map((k, i) => (
                <Keyframe keyframe={k} index={i} key={k.id} />
              ))}
              {provided.placeholder}
            </PlaylistContainer>
          )}
        </Droppable>
      </DragDropContext>
    )
  },
  Controls = () => {
    const dispatch = useAppDispatch(),
      store = useAppStore(),
      { convert } = simulation.useService(),
      feedbackHeight = useAppSelector(s => s.simulation.feedback.resolution.height)
    const save = useCallback(
        () => dispatch(model.addToPlaylist(store.getState().simulation)),
        [dispatch, store]
      ),
      restore = useCallback(() => {
        const playlist = store.getState().io.playlist
        if (playlist.length) dispatch(simulation.model.restore(playlist[playlist.length - 1].state))
      }, [dispatch, store]),
      download = (height: number) =>
        convert(height)
          .then(blob => {
            console.log(blob)
            saveAs(blob, "feedback")
          })
          .catch(e => {
            console.error(e)
            alert("Couldn't save feedback")
          })
    return (
      <div style={{ display: "flex" }}>
        <Button onClick={save}>Save</Button>
        <Button onClick={restore}>Restore Last Save</Button>
        <Button onClick={() => download(feedbackHeight > 2160 ? 2160 : feedbackHeight)}>
          Download
        </Button>
      </div>
    )
  }
