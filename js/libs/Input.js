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