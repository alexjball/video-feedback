# video-feedback

Fork in prep of the art fair.

Goals

1. Epilepsy warning
2. Save image to file directly
3. Get better computer
4. Fully encapsulate simulation state into JSON-able objects, including simulation resolution.
5. Separate ordered and unorded state variables.
6. Better color selection.
7. Support for drawing onto canvas.
8. Polish up the UI.
9. Mapping between prints and states. Lookup code on UI and print.
10. Display fields for camera position and screen aspect ratio.
11. Clean up the code enough to be able to change simulation resolution without page reload.
12. Explanation paragraphs.

Have a top level simultion object that manages the internal program state. Define an input object which performs bookkeeping of the logical state of the simulation. The simulation object defines functions for translating logical to internal state, once per frame or however often. The logical state can be updated continuously.

Set up the toolbar to control the logical state, but keep all state maintenance inside the toolbar. When the toolbar is updated, update the state object from the toolbar object. Register a callback from the input object to the toolbar so that when the input object is change programatically, the toolbar is notified to update itself.
