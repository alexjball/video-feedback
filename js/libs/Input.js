window.inputIndex = 0;
window.currentCycleHandle = 0;

window.nextInputEvent = new CustomEvent("doneCycling");
document.addEventListener("doneCycling",
    function(event) {
        if (inputIndex < inputList.length - 1) {
            window.currentCycleHandle = cycleInputs(inputIndex);
        }
        else {
            inputIndex = 0;
        }
    }, false);


window.Input = function(inputObj) {
    if (!inputObj) {
        // default parameters
        this.invertX = false;
        this.invertY = false;
        this.mirrorX = true;
        this.mirrorY = false;
        this.diagNE = false;
        this.diagNW = false;
        this.invertColor = false;
        this.farOut = false;

        this.beatLength = 3000;
        this.colorCycle = 0.5;
        this.gain = 0.5;
        this.borderWidth = 0.05;
        this.delay = 5;

        this.backgroundColor = "#70b2c5";
        this.borderColor = "#000000";

        this.x = 0;
        this.y = 0;
        this.rot = 0;     // radians
        this.scale = 0.8;
    }

    else {
        // copy-constructor
        this.load(inputObj);
    }
}


// Method: save instance to specified list
Input.prototype.saveToList = function(list) {
    list.push(new Input(this));
}


// Method: copy-load object to instance
Input.prototype.load = function(inputObj) {
    // copy-constructor
    for (var param in inputObj) {
        var t = typeof inputObj[param];
        if (t == "string" || t == "number" || t == "boolean") {
            this[param] = inputObj[param];
        }
    }
}


// External functions
// cycle through inputList
function cycleInputs(dt) {
    var tempInput = new Input();

    step += dt / inputs.beatLength;

    if (step >= 1) {
        inputIndex++;
        step--;
    }

    var currentInput = inputList[inputIndex % inputList.length];
    var nextInput = inputList[(inputIndex + 1) % inputList.length];

    for (var param in tempInput) {
        var t = typeof tempInput[param];
        if (param == "x" || param == "y" || param == "rot" || param == "scale") {
            // t == "number" && param != "delay" && param != "colorCycle" && param != "borderWidth" && param != "beatLength") {
            tempInput[param] = (1 - step) * currentInput[param] +
            step * nextInput[param];
        }
    }

    return [tempInput.x, tempInput.y, tempInput.rot, tempInput.scale];
}


function clearInputList() {
    while (inputList.length > 0) {
        inputList.pop();
    }
}


// shuffle list
function shuffle(list) {
    var i, j, temp;

    for (i = list.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        temp = list[i];
        list[i] = list[j];
        list[j] = temp;
    }

    return list;
}


// Sweep phase space, saving images along the way.
function sweepInputs(steps, rotSteps) {
    console.log("starting sweep.");

    updateCameraOn = false;
    inputs.mirrorX = true;

    inputs.x = 0; // -1 * window.aspect / 2;
    inputs.y = -1 / 2;
    inputs.rot = 0;
    inputs.scale = 0.8;
    inputs.delay = 1;

    var dataString = "";
    var saveList = [];

    saveList.push(new Input(inputs));

    for (var i = 0; i < steps; i++) {
        inputs.x = (aspect / 2) * i / (steps - 1) - 0;

        for (var j = 0; j < steps; j++) {
            inputs.y = 1 * j / (steps - 1) - (1 / 2);

            for (var k = 0; k < rotSteps; k++) {
                inputs.rot = (2 * Math.PI) * k / (rotSteps - 1) - 0;

                if (inputs.rot == 0 || inputs.rot == Math.PI) {
                    continue;
                }

                saveList.push(new Input(inputs));

                /* for (var l = 0; l < steps; l++) {
                    inputs.scale = 0.3 * l / (steps - 1);
                } */
            }
        }
    }

    var timeout = 500;
    var minutes = saveList.length * timeout / 1000 / 60;
    console.log("generating " + saveList.length + " images. estimated time: " + minutes + "minutes.");

    updateCameraOn = true;

    var i = 1;
    inputs = saveList[0];

    var dataText = document.createElement("textarea");
    dataText.style.display = "none";

    var repeat = function() {
        // add image data to 'dataString'
        var dataURL = document.getElementsByTagName("canvas")[0].toDataURL("image/png").toString();
        var altText = [inputs.x, inputs.y, inputs.rot, inputs.scale].toString();
        dataText.value += '<img src="' + dataURL + '" style="width:200px;" alt="(' + altText + ')">';

        inputs = saveList[i];

        i++;

        if (i == saveList.length) {
            // when finished looping, set innerHTML to dataString & exit loop.
            // window.document.body.innerHTML = dataString;
            // window.document.body.style.overflow = "auto";

            console.log("finished sweep.");
            clearInterval(loopID);

            var newWindow = window.open("about:blank");
            newWindow.document.body.innerHTML = dataText.value;
        }
    }

    var loopID = setInterval(repeat, timeout);

    return loopID;
}


// busy sleep
function sleep(duration) {
    var now = performance.now();

    while (performance.now() < now + duration) {
        console.log("augh");
    }
}


// Compare two input objects on phase properties (x, y, rot, scale).
// Returns true if they match & false otherwise.
function compareInputs(a, b) {
    var match = true;

    for (var param in a) {
        if (param == "x" || param == "y" || param == "rot" || param == "scale") {
            match = match && (a[param] === b[param]);
        }
    }

    return match;
}


// Compare two input objects on all properties.
// Returns true if they match & false otherwise.
function compareInputsStrict(a, b) {
    var match = true;

    for (var param in a) {
        var t = typeof a[param];

        if (t == "boolean" || t == "number" || t == "string") {
            match = match && (a[param] === b[param]);
        }
    }

    return match;
}


// update camera from inputObj
function updateCamera(inputObj) {
    for (var param in inputObj) {
        // update boolean options
        if (typeof inputObj[param] == "boolean") {
            if (!symPass.uniforms[param]) {
                if (!colorPass.uniforms[param]) {
                    switch(param) {
                        case "farOut":
                            farOut(inputObj[param], feedbackProcessor, RGBShiftPass);
                            break;
                    }
                }
                else {
                    colorPass.uniforms[param].value = inputObj[param] ? 1 : 0;
                }
            }
            else {
                symPass.uniforms[param].value = inputObj[param] ? 1 : 0;
            }
        }

        // update range options
        else if (typeof inputObj[param] == "number") {
            if (!colorPass.uniforms[param]) {
                // handle on case basis
                switch(param) {
                    case "borderWidth":
                        border.setScale(inputObj.borderWidth);
                        break;
                }
            }

            else {
                colorPass.uniforms[param].value = inputObj[param];
            }
        }

        // update color options
        else if (typeof inputObj[param] == "string") {
            switch(param) {
                case "backgroundColor":
                    var colorValue = inputObj[param].replace("#", "0x");
                    bgMaterial.color.setHex(colorValue);
                    break;
                case "borderColor":
                    var colorValue = inputObj[param].replace("#", "0x");
                    borderMaterial.color.setHex(colorValue);
                    break;
            }
        }
    }

    // update x, y, rot, scale
    feedbackCamera.position.x = inputObj.x;
    feedbackCamera.position.y = inputObj.y;
    feedbackCamera.rotateAbs(inputObj.rot);
    feedbackCamera.setScale(inputObj.scale);
}