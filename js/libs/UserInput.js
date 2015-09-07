window.mouseDown = false;
window.rightClick = false;
window.mouseX = 0, window.mouseY = 0;
window.mouseX0 = 0, window.mouseY0 = 0;
window.cameraX0 = 0, window.cameraY0 = 0;
window.cameraR0 = 0;
window.touchDistance = 1;
window.newTouchDistance = 0;
window.touchZoom = 0;
window.touchRotationInit = 0;
window.touchRotation = 0;


// FastClick.js
document.addEventListener('DOMContentLoaded',
                          function() {
                          FastClick.attach(document.body);
                          }, false);


// Disable context menu
document.addEventListener("contextmenu", function(e) { e.preventDefault() },
                          false);


// Keyboard events
document.addEventListener('keydown', keyboardHandler, false);

function keyboardHandler(evt) {
    if (!userInputOn) {
        return;
    }

    //evt = evt || window.event;
    var charCode = evt.keyCode || evt.which;
    var charStr = String.fromCharCode(charCode);

    switch(charStr) {
        case "A":
            inputs.rot -= inputSettings.rotStep;
            break;
        case "D":
            inputs.rot += inputSettings.rotStep;
            break;
        case "W":
            inputs.scale += inputSettings.zStep;
            break;
        case "S":
            inputs.scale -= inputSettings.zStep;
            break;
        case "J":
            inputs.x += inputSettings.xyStep;
            break;
        case "L":
            inputs.x -= inputSettings.xyStep;
            break;
        case "I":
            inputs.y -= inputSettings.xyStep;
            break;
        case "K":
            inputs.y += inputSettings.xyStep;
            break;
    }
}


// Mouse events
document.addEventListener("mousedown", onMouseDown, false);
document.addEventListener("mousemove", onMouseMove, false);
document.addEventListener("mouseup", onMouseUp, false);

function onMouseDown(event) {
    mouseX0 = event.clientX;
    mouseX = mouseX0;
    mouseY0 = c_height - event.clientY;
    mouseY = mouseY0;
    cameraX0 = inputs.x;
    cameraY0 = inputs.y;

    if (!userInputOn) {
        return;
    }

    // disable mouseDown handler when mouse is within the toolbar
    if (mouseX > toolbar.rect.left) {
        return;
    }

    mouseDown = true;

    if (event.button == 2) {
        rightClick = true;
        cameraR0 = inputs.rot;
    }
}

function onMouseMove(event) {
    // flip y-coordinate for mouseY
    mouseX = event.clientX;
    mouseY = c_height - event.clientY;
}

function onMouseUp(event) {
    mouseDown = false;
    rightClick = false;

    // Update cycling after drag.
    /* if (event.clientX < toolbar.rect.left && cycleInputsOn && userInputOn) {
        step = 0;
        inputList.splice(inputIndex + 1, 0, new Input(inputs));
        inputIndex++;
    } */
}


// Scroll events
document.addEventListener("mousewheel", scrollHandler, false);
document.addEventListener("DOMMouseScroll", scrollHandler, false); // firefox

function scrollHandler(event) {
    // disable handler when mouse is within the gui box
    if (mouseX > toolbar.rect.left) {
        return;
    }

    var d = ((typeof event.wheelDelta != "undefined") ? (-event.wheelDelta) :
             evt.detail);
    d = ((d > 0) ? -1 : 1);

    inputs.scale += d * inputs.scale * inputSettings.zStep / 4; // #hardcode
}


// Touch events
if (window.touchOn === true) {
    document.addEventListener("touchstart", touchstart_handler, false);

    document.addEventListener("touchmove", touchmove_handler, false);

    document.addEventListener("touchend", touchend_handler, false);
    document.addEventListener("touchcancel", touchend_handler, false);
    document.addEventListener("touchleave", touchend_handler, false);
}


function touchstart_handler(event) {
    if (!userInputOn) {
        return;
    }

    // 1 finger: panning
    if (event.targetTouches.length == 1) {
        mouseX0 = event.targetTouches[0].clientX;
        mouseX = mouseX0;
        mouseY0 = c_height - event.targetTouches[0].clientY;
        mouseY = mouseY0;
        cameraX0 = inputs.x;
        cameraY0 = inputs.y;

        // disable handler when mouse is within the gui box
        if (mouseX > toolbar.rect.left) {
            return;
        }

        if (!userInputOn) {
            return;
        }

        mouseDown = true;
        rightClick = false;
    }

    // 2+ fingers: zoom/rotate
    else if (event.targetTouches.length >= 2) {
        mouseDown = false; // until pan references are set below

        var x1 = event.targetTouches[0].clientX;
        var x2 = event.targetTouches[1].clientX;
        var y1 = c_height - event.targetTouches[0].clientY;
        var y2 = c_height - event.targetTouches[1].clientY;

        // reset pan reference
        mouseX0 = (x1 + x2) / 2;
        mouseX = mouseX0;
        mouseY0 = (y1 + y2) / 2;
        mouseY = mouseY0;
        cameraX0 = inputs.x;
        cameraY0 = inputs.y;

        // allow pan updates
        mouseDown = true;

        // zoom
        touchDistance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

        // rotation
        touchRotationInit = Math.atan2(y2 - y1, x2 - x1);
    }
}

function touchmove_handler(event) {
    event.preventDefault(); // prevents scrolling, drag-refresh, &c.

    if (event.targetTouches.length == 1) {
        mouseX = event.targetTouches[0].clientX;
        mouseY = c_height - event.targetTouches[0].clientY;
    }

    else if (event.targetTouches.length >= 2) {
        var x1 = event.targetTouches[0].clientX;
        var x2 = event.targetTouches[1].clientX;
        var y1 = c_height - event.targetTouches[0].clientY;
        var y2 = c_height - event.targetTouches[1].clientY;

        // avg. pan
        mouseX = (x1 + x2) / 2;
        mouseY = (y1 + y2) / 2;

        // zoom
        newTouchDistance = Math.sqrt(Math.pow(x2 - x1, 2) +
                                     Math.pow(y2 - y1, 2));
        touchZoom = -1 + newTouchDistance / touchDistance;
        inputs.scale += touchZoom / 2;
        touchDistance = newTouchDistance;

        // rotation
        rightClick = true;
        touchRotation = Math.atan2(y2 - y1, x2 - x1);
    }
}

function touchend_handler(event) {
    if (event.targetTouches.length == 0) {
        // close shop
        mouseDown = false;
        rightClick = false;
    }
    else if (event.targetTouches.length == 1) {
        // reset pan reference
        mouseX0 = event.targetTouches[0].clientX;
        mouseX = mouseX0;
        mouseY0 = c_height - event.targetTouches[0].clientY;
        mouseY = mouseY0;
        cameraX0 = inputs.x;
        cameraY0 = inputs.y;

        mouseDown = true;
        rightClick = false;
    }
    else if (event.targetTouches.length >= 2) {
        // set up zoom/rotate
    }
}


// -----------------------------------------------------------------------------

// updates 'inputObj' from given user input.
function updateFromUserInputs(inputObj) {
    // Right-click drag rotation
    if (window.rightClick == true) {
        if (window.touchOn == true) {
            // rotation (touchRotation(Init) defined running CCW,
            // hence the negative sign)
            inputObj.rot += -1 * (touchRotation - touchRotationInit);
            touchRotationInit = touchRotation;

            // panning #hardcode
            var dx = inputSettings.xyStep * (mouseX - mouseX0) * 40 / c_width
            / inputObj.scale;
            var dy = inputSettings.xyStep * (mouseY - mouseY0) * 40 / c_height
            / inputObj.scale;

            inputObj.x = cameraX0 - dx;
            inputObj.y = cameraY0 - dy;
        }

        else {
            var angle = (mouseX - mouseX0) / c_width / inputObj.scale;
            inputObj.rot += angle;
            mouseX0 = mouseX;
        }
    }

    else {
        // only pan #hardcode
        var dx = inputSettings.xyStep * (mouseX - mouseX0) * 40 / c_width
        / inputObj.scale;
        var dy = inputSettings.xyStep * (mouseY - mouseY0) * 40 / c_height
        / inputObj.scale;

        inputObj.x = cameraX0 - dx;
        inputObj.y = cameraY0 - dy;
    }
}