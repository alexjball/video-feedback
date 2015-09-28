window.Toolbar = function() {
    this.girth = 150;
    this.itemHeight = 35;
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
    document.getElementById("instructions").appendChild(newDiv);
}


// Method: add option
Toolbar.prototype.add = function(id, name, type, options) {
    // Make div
    var newDiv = document.createElement("div");

    // Make text label
    var newContent = name;

    if (type == "button") {
        newContent = "";
    }

    var newTextDiv = document.createElement("div");
    newTextDiv.appendChild(document.createTextNode(newContent));

    // Make input
    var newInput = document.createElement("input");
    var newInputDiv = document.createElement("div");
    newInputDiv.appendChild(newInput);

    // Input parameters
    newInput.id = id;
    newInput.name = name;
    newInput.type = type;

    // Formatting for checkbox/color inputs. Do later in CSS
    if (type == "checkbox") {
        newDiv.className = "toolbarCheckbox";

        // #hack
        newTextDiv.style.width = this.girth - 50;
        newTextDiv.style.position = "absolute";
        newTextDiv.style.left = "0px";
        newInputDiv.style.width = 50;
        newInputDiv.style.position = "absolute";
        newInputDiv.style.right = "0px";

        // callback
        newInput.onchange = function() {
            inputs[id] = newInput.checked;
            if (options) options();
        }
    }
    else if (type == "button") {
        newDiv.className = "toolbarButton";

        // callback
        newInput.onclick = options;
    }
    else if (type == "range") {
        newDiv.className = "toolbarRange";

        // callback
        newInput.oninput = function() {
            inputs[id] = Number(newInput.value);
        }
    }
    else if (type == "color") {
        newDiv.className = "toolbarColor";

        // callback
        newInput.oninput = function() {
            inputs[id] = newInput.value;
        }
    }

    // Set defaults
    if (type == "range") {
        newInput.min = options ? options[0] : 0;
        newInput.step = options ? options[1] : 0.001;
        newInput.max = options ? options[2] : 1;

        newInput.value = inputs[id];
        newInput.style.width = this.girth - 10;
    }
    else if (type == "color") {
        newInput.value = inputs[id];
    }
    else if (type == "button") {
        // button text
        newInput.value = name;
    }

    // Create div and add to toolbar
    newDiv.appendChild(newTextDiv);
    newDiv.appendChild(newInputDiv);
    this.element.appendChild(newDiv);

    return newInput;
}