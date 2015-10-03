// Detect mobile interface.
window.touchOn = false;
(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))touchOn = true})(navigator.userAgent||navigator.vendor||window.opera);


// Create object to hold user input parameters. Update these through event handlers.
window.userInput = {
    mouseDown : false,
    rightClick : false,

    camera : {
        X0 : 0,
        Y0 : 0,
        R0 : 0
    },

    mouse : {
        X  : 0,
        X0 : 0,
        Y  : 0,
        Y0 : 0
    },

    touch : {
        distance  : 1,
        distance0 : 0,
        rotation  : 0,
        rotation0 : 0
    },

    updateCamera : function(inputObj) {
        this.camera.X0 = inputs.x;
        this.camera.Y0 = inputs.y;
        this.camera.R0 = inputs.rot;
    },

    updateMouse : function(x, y) {
        this.mouse.X = x;
        this.mouse.Y = y;
    },

    updateMouse0 : function(x0, y0) {
        this.mouse.X0 = x0;
        this.mouse.Y0 = y0;
    },

    updateTouch : function(distance, rotation) {
        this.touch.distance = distance;
        this.touch.rotation = rotation;
    },

    updateTouch0 : function(distance0, rotation0) {
        this.touch.distance0 = distance0;
        this.touch.rotation0 = rotation0;
    }
};


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

// Later, have all of the below set a global/private object properties, or pass
//     the object to updateFromUserInputs(inputObj).
function onMouseDown(event) {
    if (!userInputOn) {
        return;
    }

    // Disable handler when mouse is within the toolbar
    if (event.clientX > toolbar.rect.left) {
        return;
    }

    // Update userInput object.
    userInput.updateMouse(event.clientX, window.innerHeight - event.clientY);
    userInput.updateMouse0(event.clientX, window.innerHeight - event.clientY);
    userInput.updateCamera(window.inputs);

    // Turn on click events.
    userInput.mouseDown = true;

    // Right-click
    if (event.button == 2) {
        userInput.rightClick = true;
    }
}

function onMouseMove(event) {
    if (!userInputOn) {
        return;
    }

    userInput.updateMouse(event.clientX, window.innerHeight - event.clientY);
}

function onMouseUp(event) {
    // Update cycling after drag.
    var cycleTrue = event.clientX < toolbar.rect.left && cycleInputsOn &&
        userInputOn && userInput.mouseDown;

    if (cycleTrue) {
        window.step = 0;
        inputList.splice(inputIndex + 1, 0, new Input(inputs));
        inputIndex++;
     }

    // Turn off mouse events.
    userInput.mouseDown = false;
    userInput.rightClick = false;
}


// Scroll events
document.addEventListener("mousewheel", scrollHandler, false);
document.addEventListener("DOMMouseScroll", scrollHandler, false); // firefox

function scrollHandler(event) {
    // Disable handler when mouse is within the toolbar
    if (event.clientX > toolbar.rect.left) {
        return;
    }

    // Disable default action (scrolling).
    event.preventDefault();

    // Set scaling direction (scroll down = zoom in).
    var d = ((typeof event.wheelDelta != "undefined") ? (-event.wheelDelta) :
             evt.detail);
    d = ((d > 0) ? 1 : -1);

    inputs.scale += d * inputSettings.zStep / 4; // #hardcode #fix
}


// Touch events
if (touchOn) {
    document.addEventListener("touchstart", onTouchStart, false);
    document.addEventListener("touchmove", onTouchMove, false);
    document.addEventListener("touchend", onTouchEnd, false);
    document.addEventListener("touchcancel", onTouchEnd, false);
    document.addEventListener("touchleave", onTouchEnd, false);
}


function onTouchStart(event) {
    if (!userInputOn) {
        return;
    }

    // 1 finger: panning
    if (event.targetTouches.length == 1) {
        // Disable handler when touch is within the toolbar
        if (event.targetTouches[0].clientX > toolbar.rect.left) {
            return;
        }

        // Update userInput object.
        userInput.updateMouse(event.targetTouches[0].clientX, window.innerHeight - event.targetTouches[0].clientY);
        userInput.updateMouse0(event.targetTouches[0].clientX, window.innerHeight - event.targetTouches[0].clientY);
        userInput.updateCamera(window.inputs);

        // Turn on click events.
        userInput.mouseDown = true;
        userInput.rightClick = false;
    }

    // 2+ fingers: zoom/rotate
    else if (event.targetTouches.length >= 2) {
        // Turn off click events temporarily -- until move positions are set.
        userInput.mouseDown = false;

        var x1 = event.targetTouches[0].clientX;
        var x2 = event.targetTouches[1].clientX;
        var y1 = window.innerHeight - event.targetTouches[0].clientY;
        var y2 = window.innerHeight - event.targetTouches[1].clientY;

        // Set pan reference.
        userInput.updateMouse0((x1 + x2) / 2, (y1 + y2) / 2);
        userInput.updateMouse((x1 + x2) / 2, (y1 + y2) / 2);
        userInput.updateCamera(window.inputs);

        // Turn click events back on.
        userInput.mouseDown = true;
        userInput.rightClick = true;

        // Set default zoom and rotation values.
        userInput.updateTouch0(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
                               Math.atan2(y2 - y1, x2 - x1));
    }
}

function onTouchMove(event) {
    // Prevent scrolling, drag-refresh, &c.
    event.preventDefault();

    // 1 finger: pan
    if (event.targetTouches.length == 1) {
        // Update mouse position for panning.
        userInput.updateMouse(event.targetTouches[0].clientX,
                              window.innerHeight - event.targetTouches[0].clientY);
    }

    // 2+ fingers: zoom/rotate
    else if (event.targetTouches.length >= 2) {
        var x1 = event.targetTouches[0].clientX;
        var x2 = event.targetTouches[1].clientX;
        var y1 = window.innerHeight - event.targetTouches[0].clientY;
        var y2 = window.innerHeight - event.targetTouches[1].clientY;

        // Update mouse position for panning.
        userInput.updateMouse((x1 + x2) / 2, (y1 + y2) / 2);

        // Update zoom and rotation values.
        userInput.updateTouch(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
                              Math.atan2(y2 - y1, x2 - x1));
        userInput.touch.distance0 = userInput.touch.distance;

        // Update scale. #fix
        inputs.scale += -0.5 * userInput.touch.distance / userInput.touch.distance0;
    }
}

function onTouchEnd(event) {
    if (event.targetTouches.length == 0) {
        // Disable click events.
        userInput.mouseDown = false;
        userInput.rightClick = false;
    }

    else if (event.targetTouches.length == 1) {
        // Reset panning reference to accommodate one finger.
        userInput.updateMouse(event.targetTouches[0].clientX,
                              window.innerHeight - event.targetTouches[0].clientY);
        userInput.updateMouse0(event.targetTouches[0].clientX,
                               window.innerHeight - event.targetTouches[0].clientY);
        userInput.updateCamera(window.inputs);

        // Update click events.
        userInput.mouseDown = true;
        userInput.rightClick = false;
    }
}


// -----------------------------------------------------------------------------

// Updates 'inputObj' from userInput object.
function updateFromUserInputs(inputObj, userInputObj) {
    // Touch: 2+ fingers
    if (touchOn && userInput.rightClick) {
        // Rotation defined running CCW ==> negative sign
        inputObj.rot = userInput.camera.R0 - (userInput.touch.rotation -
                                              userInput.touch.rotation0);

        // Panning
        var dx = (userInput.mouse.X - userInput.mouse.X0) / c_width / inputObj.scale;
        var dy = (userInput.mouse.Y - userInput.mouse.Y0) / c_height / inputObj.scale;

        inputObj.x = userInput.camera.X0 - dx;
        inputObj.y = userInput.camera.Y0 - dy;
    }

    // Right-click drag to rotate
    else if (!touchOn && userInput.rightClick) {
        var angle = (userInput.mouse.X - userInput.mouse.X0) / c_width /
            inputObj.scale;
        inputObj.rot = userInput.camera.R0 + angle;
    }

    // Pan only
    else {
        var dx = (userInput.mouse.X - userInput.mouse.X0) / c_width / inputObj.scale;
        var dy = (userInput.mouse.Y - userInput.mouse.Y0) / c_height / inputObj.scale;

        inputObj.x = userInput.camera.X0 - dx;
        inputObj.y = userInput.camera.Y0 - dy;
    }
}