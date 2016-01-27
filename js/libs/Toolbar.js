// Set up button that controls the toolbar visibility
function toggleToolbar() {
    if (toolbar.element.getBoundingClientRect().width != 0) {
        toolbar.element.style.width = 0;
        toolbar.rect = toolbar.element.getBoundingClientRect();
    }
    else {
        toolbar.element.style.width = "20%";
        toolbar.rect = toolbar.element.getBoundingClientRect();
    }
}


// Toolbar class
window.Toolbar = function() {
    this.element = document.getElementById("toolbar");
    this.rect = document.getElementById("toolbar").getBoundingClientRect();
}


// Method: add instruction
Toolbar.prototype.addInstruction = function(text) {
    // Make div
    var newDiv = document.createElement("div");
    newDiv.className = "toolbarInstruction";

    // Make content
    var newContent = text;

    // prepend to toolbar
    newDiv.appendChild(document.createTextNode(newContent));
    document.getElementById("toolbar").appendChild(newDiv);
}


// Method: add button
Toolbar.prototype.addButton = function(text, callback) {
    // Make div
    var newDiv = document.createElement("div");
    newDiv.className = "toolbarButton";
    
    // Make input & div
    var newInput = document.createElement("input");
    newInput.type = "button";
    var newInputDiv = document.createElement("div");
    newInputDiv.appendChild(newInput);
    
    newInput.value = text;
    newInput.onclick = callback;
    
    // Add to toolbar div
    newDiv.appendChild(newInputDiv);
    this.element.appendChild(newDiv);
}


// Method: add dropdown list
Toolbar.prototype.addDropdown = function(text, id, options) {
    // Make div
    var newDiv = document.createElement("div");
    newDiv.classname = "toolbarDropdown";
    
    // Make text label
    var newTextDiv = document.createElement("div");
    newTextDiv.appendChild(document.createTextNode(text));
    
    // Make input & div
    var newInput = document.createElement("select");
    newInput.id = id;
    var newInputDiv = document.createElement("div");
    newInputDiv.appendChild(newInput);
    
    // Add list options to selection
    for (item in options) {
        var newOption = document.createElement("option");
        var optionLabel = document.createTextNode(options[item][0]);
        newOption.appendChild(optionLabel);
        newInput.appendChild(newOption);
    }
    
    // Add button to change selection
    var newButton = document.createElement("input");
    newButton.type = "button";
    newButton.value = "Go";
    newButton.id = id.concat("Button");
    newButton.onclick = options[newInput.selectedIndex][1];
    newInputDiv.appendChild(newButton);
    
    // Add an onclick method for the dropdown box itself so that 
    // it updates the callback function for the "Go" button
    newInput.oninput = function() {
        newButton.onclick = options[newInput.selectedIndex][1];
    };
    
    // Add to toolbar div
    newDiv.appendChild(newTextDiv);
    newDiv.appendChild(newInputDiv);
    this.element.appendChild(newDiv);
}


function refreshDropdownById(id, options) {
    var input = document.getElementById(id);
    var button = document.getElementById(id.concat("Button"));
    
    // Remove all options
    while (input.lastChild) {
        input.removeChild(input.lastChild);
    }
    
    // Add new options
    for (item in options) {
        var newOption = document.createElement("option");
        var optionLabel = document.createTextNode(options[item][0]);
        newOption.appendChild(optionLabel);
        input.appendChild(newOption);
    }
    
    // Update button behavior
    button.onclick = options[input.selectedIndex][1];
    
    // Update button-updating behavior
    input.oninput = function() {
        button.onclick = options[input.selectedIndex][1];
    };
}


// Method: add checkbox
// - inputParam must match the name of the (Boolean) parameter in the 
//   inputObj that needs to be changed
Toolbar.prototype.addCheckbox = function(text, inputParam) {
    // Make div
    var newDiv = document.createElement("div");
    
    // Make text label
    var newTextDiv = document.createElement("div");
    newTextDiv.appendChild(document.createTextNode(text));
    
    // Make input
    var newInput = document.createElement("input");
    newInput.type = "checkbox";
    newInput.id = inputParam;
    var newInputDiv = document.createElement("div");
    newInputDiv.appendChild(newInput);
    
    newDiv.className = "toolbarCheckbox";

    // #hack
    newTextDiv.style.width = "70%";
    newTextDiv.style.position = "absolute";
    newTextDiv.style.left = "0px";
    newInputDiv.style.width = "20%";
    newInputDiv.style.position = "absolute";
    newInputDiv.style.right = "0px";

    // callback
    newInput.onchange = function() {
        inputs[inputParam] = newInput.checked;
    }
    
    // Add to toolbar div
    newDiv.appendChild(newTextDiv);
    newDiv.appendChild(newInputDiv);
    this.element.appendChild(newDiv);
}

// Method: add range
// - the "options" argument is optional, but otherwise it must be a 
// - 3-element array: [min, step, max] for the slider
Toolbar.prototype.addRange = function(text, inputParam, options) {
    // Make div
    var newDiv = document.createElement("div");

    var newTextDiv = document.createElement("div");
    newTextDiv.appendChild(document.createTextNode(text));

    // Make input
    var newInput = document.createElement("input");
    newInput.type = "range";
    newInput.id = inputParam;
    var newInputDiv = document.createElement("div");
    newInputDiv.appendChild(newInput);
    
    newDiv.className = "toolbarRange";

    // callback
    newInput.oninput = function() {
        inputs[inputParam] = Number(newInput.value);
    }

    // Set default range if none is provided
    newInput.min = options ? options[0] : 0;
    newInput.step = options ? options[1] : 0.001;
    newInput.max = options ? options[2] : 1;

    newInput.value = inputs[inputParam];
    newInput.style.width = 140;
    
    // Add to toolbar div
    newDiv.appendChild(newTextDiv);
    newDiv.appendChild(newInputDiv);
    this.element.appendChild(newDiv);
}


// Method: add color-picker
Toolbar.prototype.addColor = function(text, inputParam) {
    // Make div
    var newDiv = document.createElement("div");
    
    // Make text label
    var newTextDiv = document.createElement("div");
    newTextDiv.appendChild(document.createTextNode(text));
    
    // Make input
    var newInput = document.createElement("input");
    newInput.type = "color";
    newInput.id = inputParam;
    var newInputDiv = document.createElement("div");
    newInputDiv.appendChild(newInput);
    
    newDiv.className = "toolbarColor";

    // callback
    newInput.oninput = function() {
        inputs[inputParam] = newInput.value;
    }
    
    newInput.value = inputs[inputParam];
    
    // Add to toolbar div
    newDiv.appendChild(newTextDiv);
    newDiv.appendChild(newInputDiv);
    this.element.appendChild(newDiv);
}


// Initialize toolbar instance
function initializeToolbar(toolbarInstance) {
    toolbarInstance.element.style.overflow = "auto";
    toolbarInstance.rect = toolbar.element.getBoundingClientRect();

    toolbarInstance.addInstruction("Pan: IJKL/drag");
    toolbarInstance.addInstruction("Rotate: AD/right-drag");
    toolbarInstance.addInstruction("Zoom: WS/scroll");
    
    window.savedStates = [
        ["random", function() {
                        if (cycling) {
                            return;
                        }
                        setInput(
                            ["x", Math.random() * 0.3 + 0.6],
                            ["y", Math.random() * 0.7 - 0.35],
                            ["rot", Math.random() * 2 * Math.PI],
                            ["scale", Math.random() * 0.2 + 0.75]
                        );
        }],
        ["start", inputSetterFromObj(inputList[0])], 
        ["cubers", inputSetterFromObj(inputList[1])],
        ["eyes", inputSetterFromObj(inputList[2])],
        ["owl", inputSetterFromObj(inputList[3])],
        ["hot pants", inputSetterFromObj(inputList[4])],
        ["plaid", inputSetterFromObj(inputList[5])],
        ["snowflakes", inputSetterFromObj(inputList[6])],
        ["turtles", inputSetterFromObj(inputList[7])],
        ["pyramidal", inputSetterFromObj(inputList[8])],
        ["what's a fractal", inputSetterFromObj(inputList[9])],
    ];
    
    toolbarInstance.addDropdown("Select State", "stateSelect", window.savedStates);
    
    toolbarInstance.addButton("Save State", function() {
        if (cycling) {
            return;
        }
        
        var inputName = prompt("Please enter a name for the current state.");
        if (inputName == "") {
            inputName = "newState";
        }

        window.savedStates.push(
            [inputName, inputSetterFromObj(new Input(inputs))]
        );
    
        window.inputList.push(new Input(inputs));

        refreshDropdownById("stateSelect", window.savedStates)
    });
    
    toolbarInstance.addButton("Cycle Inputs", function() {
        if (window.cycling) {
            return;
        }
        cycleHandler = cycleInputs();
    });
    toolbarInstance.addButton("Stop Cycle", 
                     function() {
                         if (window.cycling) {
                             userInputOn = true;
                             clearInterval(cycleHandler);
                             inputIndex = 0;
                             window.cycling = false;
                         }
                    });
    
    toolbarInstance.addCheckbox("Invert X", "invertX");
    toolbarInstance.addCheckbox("Invert Y", "invertY");
    toolbarInstance.addCheckbox("Mirror X", "mirrorX");
    toolbarInstance.addCheckbox("Mirror Y", "mirrorY");
    toolbarInstance.addCheckbox("Mirror NE", "diagNE");
    toolbarInstance.addCheckbox("Mirror NW", "diagNW");
    toolbarInstance.addCheckbox("Invert Color", "invertColor");
    toolbarInstance.addCheckbox("Far Out", "farOut");
    
    toolbarInstance.addInstruction("");
    
    toolbarInstance.addRange("Delay", "delay", [1, 1, 10]);
    toolbarInstance.addRange("Color Cycle", "colorCycle");
    toolbarInstance.addRange("Gain", "gain");
    toolbarInstance.addRange("Border Width", "borderWidth", [0, 0.001, 0.1]);
    toolbarInstance.addRange("Beat Length", "beatLength", [500, 10, 2000]);
    
    toolbarInstance.addColor("Border", "borderColor");
    toolbarInstance.addColor("Background", "backgroundColor");
    
    toolbarInstance.addButton("Open Image", 
                      function() {
                        window.open(document.getElementsByTagName("canvas")[0].toDataURL("image/png"));
                      });
}


