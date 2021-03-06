// Set up button that controls the toolbar visibility
function toggleToolbar() {
    if (toolbar.element.getBoundingClientRect().width != 0) {
        toolbar.element.style.width = 0;
        toolbar.rect = toolbar.element.getBoundingClientRect();
    }
    else {
        toolbar.element.style.width = "200px";
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

Toolbar.prototype.addDivider = function() {
    
    var hr = document.createElement("hr");
    hr.className = 'toolbarDivider';
    document.getElementById("toolbar").appendChild(hr);  
    
}

// Method: add text field
Toolbar.prototype.addField = function(label, id, callback) {
        
    // Make div
    var newDiv = document.createElement("div");
    newDiv.className = "toolbarField";
    
    // Make text label
    var newTextDiv = document.createElement("div");
    newTextDiv.appendChild(document.createTextNode(label));
    
    // Make input & div
    var newInput = document.createElement("input");
    newInput.type = "text";
    newInput.id = id;
    var newInputDiv = document.createElement("div");
    newInputDiv.appendChild(newInput);
    
    newInput.value = '';
    newInput.oninput = callback;
    
    // Add to toolbar div
    newDiv.appendChild(newTextDiv);
    newDiv.appendChild(newInputDiv);
    this.element.appendChild(newDiv);
    
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
    newDiv.className = "toolbarDropdown";
    
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
    
    return newInput;
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
            setMe.set(new THREE.Vector3(
                Number(newInput.value), Number(newInput.value), 1));
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
        
    // Make input
    var newInput = document.createElement("input");
    newInput.type = "button";
    newInput.value = text;
    newInput.className = 'inputColor';
    var color = new jscolor(newInput, {
        onFineChange : function() {
            setMe.set(new THREE.Color(this.toHEXString()));
        },
        
        value : "#" + setMe.get().getHexString(),
        
        valueElement : null,
        
        zIndex : 1005
        
    })
    
    var newInputDiv = document.createElement("div");
    newInputDiv.appendChild(newInput);
    
    newDiv.className = "toolbarColor";
    
    // Add to toolbar div
    newDiv.appendChild(newInputDiv);
    this.element.appendChild(newDiv);
}

Toolbar.prototype.addFileInput = function(label, id, onChange) {
    var newDiv = document.createElement("div");

    var text = document.createTextNode(label);

    var newInput = document.createElement("input");
    newInput.type = "file";
    newInput.id = id;
    newInput.accept=".json,.JSON" 
    newInput.onchange = onChange;

    newDiv.appendChild(text);
    newDiv.appendChild(newInput);

    this.element.appendChild(newDiv);
}

// Initialize toolbar instance
function initializeToolbar(toolbarInstance) {
    toolbarInstance.element.style.overflow = "auto";
    toolbarInstance.rect = toolbar.element.getBoundingClientRect();
    
    toolbarInstance.addButton("About", showAbout);
    
    toolbarInstance.addDivider();

    toolbarInstance.addInstruction("Reset Position: U");
    toolbarInstance.addInstruction("FPS: T");
    toolbarInstance.addInstruction("Pause: P");
    toolbarInstance.addInstruction("Quick Save State: V");
    toolbarInstance.addDivider();
    toolbarInstance.addInstruction("2D Mode:");
    toolbarInstance.addInstruction("Pan: IJKL/drag");
    toolbarInstance.addInstruction("Rotate: AD/right-drag");
    toolbarInstance.addInstruction("Zoom: WS/scroll");
    toolbarInstance.addDivider();
    toolbarInstance.addCheckbox("3D Mode", { 
        set : function(enable) {
            app.setViewMode3d(enable ? '3d' : '2d');
            if (!enable && app.state3d.controlsController.isRunning()) {
                app.state3d.controlsController.onPointerLockLostCallback = null
                app.state3d.controlsController.stop();
                userInputOn = true;
            }
        }
    });
    toolbarInstance.addInstruction("Toggle Controls: Y");
    toolbarInstance.addInstruction("Forward/Back/Left/Right/Up/Down: WSADRF");
    toolbarInstance.addInstruction("Move Fast: hold shift");
    toolbarInstance.addInstruction("Rotate: right-drag");
    toolbarInstance.addInstruction("Color: space");
    toolbarInstance.addColor("Top Color", {
        set : function(c) { app.state3d.topColor = c; },
        get : function() { return app.state3d.topColor }
    });
    toolbarInstance.addColor("Bottom Color", {
        set : function(c) { app.state3d.bottomColor = c; },
        get : function() { return app.state3d.bottomColor }
    })

    toolbarInstance.addDivider();
        
    toolbarInstance.addButton("Reset Position", function() { app.resetPosition() })
    
    toolbarInstance.addDivider();

    toolbarInstance.addButton("Download Image", function() {
        
        canvas = app.renderer.domElement;
        
        canvas.toBlob(function(blob) {
            saveAs(blob, "feedback.png");
        });
        
    });
    
    toolbarInstance.addButton('Shareable URL', saveToHash);
    
    toolbarInstance.addDivider();
        
    toolbarInstance.addDropdown("Select State", "stateSelect", 
        stateManager.states.map( function(x) { return x.name; } ), 
        function() {
            stateManager.loadState(stateManager.states[this.selectedIndex].state);
        }
    );
    
    toolbarInstance.addButton("Save State", function() { saveStateToDropdown(); } );
    
    toolbarInstance.addButton("Cycle Inputs", vfr.startCycle.bind(vfr));
    
    toolbarInstance.addButton("Stop Cycle", vfr.stopCycle.bind(vfr));
    
    toolbarInstance.addRange("Cycle Speed", {
     
        get : function()  { return vfr.cycleSpeed; },
        set : function(x) { vfr.cycleSpeed = x; }
        
    }, [.002, .0002, .02]);

    toolbarInstance.addDivider();

    // View and Geometry
    toolbarInstance.addButton("Set Portal To Window", function() {
        var v = getViewportResolution();
        geo.set(geo.rectangle, v.width / v.height);
        
    });
    toolbarInstance.addField("Portal Aspect Ratio", 'customAspect');
    toolbarInstance.addButton('Set Portal Aspect', function() {
        
        var el = document.getElementById('customAspect');
        
        var aspect = Number(el.value);
        
        if (!(aspect > 0)) return;

        geo.set(geo.rectangle, aspect);
        
    });
    
    toolbarInstance.addDivider();

    toolbarInstance.addCheckbox("Invert X",
        app.effects.symmetry.invertX);
    toolbarInstance.addCheckbox("Invert Y", 
        app.effects.symmetry.invertY);
    toolbarInstance.addCheckbox("Mirror X", 
        app.effects.symmetry.mirrorX).checked = true;        
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
    
    toolbarInstance.addDivider();
    
    toolbarInstance.addRange("Delay", {
        get : function() { sim.getDelay() },
        set : function(x) { sim.setDelay(x) }
    }, [1, 1, 30]);
    
    toolbarInstance.addRange("Color Cycle", 
        app.effects.color.cycle);
    toolbarInstance.addRange("Gain", 
        app.effects.color.gain);
    toolbarInstance.addRange("Border Width", app.border.scale, [1, 0.001, 1.5]);
    // toolbarInstance.addRange("Beat Length", "beatLength", [500, 10, 2000]);
    
    toolbarInstance.addColor("Border Color", app.border.color);
    toolbarInstance.addColor("Background Color", app.background.color);
            
    // toolbarInstance.addButton("Snap View", app.fitViewToPortal.bind(app));
    // toolbarInstance.addButton("Match Resolution", app.syncPortalResolution.bind(app));
    
    toolbarInstance.addDivider();

    toolbarInstance.addField("Custom Res (h)", 'customResolution');
    toolbarInstance.addButton("Set Res", function() {
        
        var el = document.getElementById('customResolution');
        
        var height = Math.round(Number(el.value));
        
        if (!(height > 0)) return;
        
        app.setPortalResolutionInView(Math.round(Number(el.value)));
        
    });
            
    toolbarInstance.addButton("Save to File", function() {
        
        var newState = saveStateToDropdown();
        
        stateManager.saveStateToFile(newState);
        
    });

    toolbarInstance.addFileInput("Load JSON File", "loadfiles", function(evt) {        
        var files = evt.target.files;
        if (files.length == 0) return;
        
        var file = files[0];
        
        var name = file.name;
        var parts = name.split('.');
        if (parts.length == 0) return;
        if (parts[parts.length - 1].toLowerCase() !== "json") {
            alert("Only JSON files are supported for loading from file.");
            return;
        }
        
        var reader = new FileReader();
        reader.onload = function(evt) {
            try {
                var stateInfo = JSON.parse(evt.target.result);
                stateManager.loadState(stateInfo.state);
            } catch (e) {
                alert("Couldn't load JSON file.");
                console.error("Couldn't load JSON file.");
            }
        }

        reader.readAsText(file);

        document.getElementById("loadfiles").value = "";
    })
}

window.toolbar = new Toolbar();
initializeToolbar(window.toolbar);

function saveStateToDropdown(inputName) {
            
        if (inputName === undefined) {
            inputName = prompt("Please enter a name for the current state.");
            if (typeof inputName !== 'string') {
                resume();
                return;
            } else if (inputName == "") {
                inputName = "newState";
            } 
        }
        
        var newState = stateManager.saveState(inputName);
        inputName = newState.name;
        
        var newOption = document.createElement("option");
        var optionLabel = document.createTextNode(inputName);
        newOption.appendChild(optionLabel);

        var select = document.getElementById('stateSelect');
        
        select.appendChild(newOption);
        
        select.value = inputName;
            
        return newState;
        
}