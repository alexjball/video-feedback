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
Toolbar = function() {
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
Toolbar.prototype.addDropdown = function(text, id, options, callback) {
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
        var optionLabel = document.createTextNode(options[item]);
        newOption.appendChild(optionLabel);
        newInput.appendChild(newOption);
    }
    
    newInput.onchange = callback;
    
    // Add to toolbar div
    newDiv.appendChild(newTextDiv);
    newDiv.appendChild(newInputDiv);
    this.element.appendChild(newDiv);
}

// Method: add checkbox
// - inputParam must match the name of the (Boolean) parameter in the 
//   inputObj that needs to be changed
Toolbar.prototype.addCheckbox = function(text, setMe) {
    // Make div
    var newDiv = document.createElement("div");
    
    // Make text label
    var newTextDiv = document.createElement("div");
    newTextDiv.appendChild(document.createTextNode(text));
    
    // Make input
    var newInput = document.createElement("input");
    newInput.type = "checkbox";
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
        if (newInput.checked) {
            setMe.set(1);
        }
        else {
            setMe.set(0);
        }
    }
    
    // Add to toolbar div
    newDiv.appendChild(newTextDiv);
    newDiv.appendChild(newInputDiv);
    this.element.appendChild(newDiv);
}

// Method: add range
// - the "options" argument is optional, but otherwise it must be a 
// - 3-element array: [min, step, max] for the slider
Toolbar.prototype.addRange = function(text, setMe, options) {
    // Make div
    var newDiv = document.createElement("div");

    var newTextDiv = document.createElement("div");
    newTextDiv.appendChild(document.createTextNode(text));

    // Make input
    var newInput = document.createElement("input");
    newInput.type = "range";
    var newInputDiv = document.createElement("div");
    newInputDiv.appendChild(newInput);
    
    newDiv.className = "toolbarRange";

    // Set default range if none is provided
    newInput.min = options ? options[0] : 0;
    newInput.step = options ? options[1] : 0.001;
    newInput.max = options ? options[2] : 1;

    // callback
    if (text == "Border Width") {
        newInput.value = setMe.get().x;
        
        newInput.oninput = function() {
            setMe.set([newInput.value, newInput.value, 1]);
        }
    }
    else {
        newInput.value = setMe.get();
        
        newInput.oninput = function() {
            setMe.set(Number(newInput.value));
        }
    }

    newInput.style.width = 140;
    
    // Add to toolbar div
    newDiv.appendChild(newTextDiv);
    newDiv.appendChild(newInputDiv);
    this.element.appendChild(newDiv);
}


// Method: add color-picker
Toolbar.prototype.addColor = function(text, setMe) {
    // Make div
    var newDiv = document.createElement("div");
    
    // Make text label
    var newTextDiv = document.createElement("div");
    newTextDiv.appendChild(document.createTextNode(text));
    
    // Make input
    var newInput = document.createElement("input");
    newInput.type = "color";
    var newInputDiv = document.createElement("div");
    newInputDiv.appendChild(newInput);
    
    newDiv.className = "toolbarColor";

    // callback
    newInput.oninput = function() {
        setMe.set(newInput.value);
    }
    
    newInput.value = "#" + setMe.get().getHexString();
    
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
    
    // window.savedStates = [
    //     ["random", function() {
    //                     if (cycling) {
    //                         return;
    //                     }
    //                     setInput(
    //                         ["x", Math.random() * 0.3 + 0.6],
    //                         ["y", Math.random() * 0.7 - 0.35],
    //                         ["rot", Math.random() * 2 * Math.PI],
    //                         ["scale", Math.random() * 0.2 + 0.75]
    //                     );
    //     }]/*,
    //     ["start", inputSetterFromObj(inputList[0])], 
    //     ["cubers", inputSetterFromObj(inputList[1])],
    //     ["eyes", inputSetterFromObj(inputList[2])],
    //     ["owl", inputSetterFromObj(inputList[3])],
    //     ["hot pants", inputSetterFromObj(inputList[4])],
    //     ["plaid", inputSetterFromObj(inputList[5])],
    //     ["snowflakes", inputSetterFromObj(inputList[6])],
    //     ["turtles", inputSetterFromObj(inputList[7])],
    //     ["pyramidal", inputSetterFromObj(inputList[8])],
    //     ["what's a fractal", inputSetterFromObj(inputList[9])],
    // */
    // ];
    
    toolbarInstance.addDropdown("Select State", "stateSelect", 
        stateManager.states.map( function(x) { return x.name; } ), 
        function() {
            stateManager.loadState(stateManager.states[this.selectedIndex].state);
        }
    );
    
    toolbarInstance.addButton("Save State", function() { saveStateToDropdown(); } );
    
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
    
    toolbarInstance.addCheckbox("Invert X",
        app.effects.symmetry.invertX);
    toolbarInstance.addCheckbox("Invert Y", 
        app.effects.symmetry.invertY);
    toolbarInstance.addCheckbox("Mirror X", 
        app.effects.symmetry.mirrorX);
    toolbarInstance.addCheckbox("Mirror Y", 
        app.effects.symmetry.mirrorY);
    toolbarInstance.addCheckbox("Mirror NE",
        app.effects.symmetry.diagNE);
    toolbarInstance.addCheckbox("Mirror NW",
        app.effects.symmetry.diagNW);
    toolbarInstance.addCheckbox("Invert Color", 
        app.effects.color.invert);
    toolbarInstance.addCheckbox("Far Out",
        app.effects.RGBShift.enable);
    
    toolbarInstance.addInstruction("");
    
    // toolbarInstance.addRange("Delay", "delay", [1, 1, 30]);
    toolbarInstance.addRange("Color Cycle", 
        app.effects.color.cycle);
    toolbarInstance.addRange("Gain", 
        app.effects.color.gain);
    toolbarInstance.addRange("Border Width", app.border.scale, [1, 0.001, 1.5]);
    // toolbarInstance.addRange("Beat Length", "beatLength", [500, 10, 2000]);
    
    toolbarInstance.addColor("Border", app.border.color);
    toolbarInstance.addColor("Background", app.background.color);
    
    toolbarInstance.addButton("Open Image", 
                      function() {
                        window.open(document.getElementsByTagName("canvas")[0].toDataURL("image/png"));
                      });
}

window.toolbar = new Toolbar();
initializeToolbar(window.toolbar);

function saveStateToDropdown(inputName) {
    
        pause();
        
        if (inputName === undefined) {
            inputName = prompt("Please enter a name for the current state.");
            if (typeof inputName !== 'string') {
                resume();
                return;
            } else if (inputName == "") {
                inputName = "newState";
            } 
        }
        
        inputName = stateManager.saveState(inputName).name;
        
        var newOption = document.createElement("option");
        var optionLabel = document.createTextNode(inputName);
        newOption.appendChild(optionLabel);

        var select = document.getElementById('stateSelect');
        
        select.appendChild(newOption);
        
        select.value = inputName;
        
        resume();
    
}