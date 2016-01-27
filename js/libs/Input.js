window.Input = function(inputObj) {
    if (!inputObj) {
        // default parameters
        this.invertX = false;
        this.invertY = false;
        this.mirrorX = false;
        this.mirrorY = false;
        this.diagNE = false;
        this.diagNW = false;
        this.invertColor = false;
        this.farOut = false;

        this.beatLength = 1000;
        this.colorCycle = 0.5;
        this.gain = 0.5;
        this.borderWidth = 0.05;
        this.delay = 8;

        this.backgroundColor = "#70b2c5";
        this.borderColor = "#000000";

        this.x = 0;
        this.y = 0;
        this.rot = 0;     // radians
        this.scale = 0.8;
    }

    else {
        // copy-constructor
        for (var param in inputObj) {
            var t = typeof inputObj[param];
            if (t == "string" || t == "number" || t == "boolean") {
                this[param] = inputObj[param];
            }
        }
    }
}


// Method: save instance to inputList
Input.prototype.saveToList = function() {
    inputList.push(new Input(this));
}


// function that returns any input value
function getInput(inputParam) {
    var inputValue = window.inputs[inputParam];
    return inputValue;
}


// function to change any input & also update the toolbar
function setInput() {
    // Check whether the argument is an input object
    if (arguments.length == 1 && "x" in arguments[0]) {
        // Update inputs object
        window.inputs = new Input(arguments[0]);
        
        // Update toolbar
        var keys = Object.keys(window.inputs);
        for (var key in keys) {
            var inputParam = keys[key];
            var inputValue = window.inputs[inputParam];
            
            switch (inputParam) {
                case "x":
                case "y":
                case "rot":
                case "scale":
                    break;
                    
                case "invertX":
                case "invertY":
                case "mirrorX":
                case "mirrorY":
                case "diagNE":
                case "diagNW":
                case "invertColor":
                case "farOut":
                    toolbarObj = document.getElementById(inputParam);
                    toolbarObj.checked = inputValue;
                    break;
                    
                case "beatLength":
                case "colorCycle":
                case "gain":
                case "borderWidth":
                case "delay":
                case "backgroundColor":
                case "borderColor":
                    toolbarObj = document.getElementById(inputParam);
                    toolbarObj.value = inputValue;
                    break;
                    
                default:
                    new Error("Can't set a non-existent input property.");
            }
        }
    }
    
    // Otherwise, just update the inputs as given.
    else {
        for (var arg in arguments) {
            var inputParam = arguments[arg][0];
            var inputValue = arguments[arg][1];

            // Update inputs object
            inputs[inputParam] = inputValue;

            // Update toolbar
            switch (inputParam) {
                case "x":
                case "y":
                case "rot":
                case "scale":
                    break;
                    
                case "invertX":
                case "invertY":
                case "mirrorX":
                case "mirrorY":
                case "diagNE":
                case "diagNW":
                case "invertColor":
                case "farOut":
                    toolbarObj = document.getElementById(inputParam);
                    toolbarObj.checked = inputValue;
                    break;
                    
                case "beatLength":
                case "colorCycle":
                case "gain":
                case "borderWidth":
                case "delay":
                case "backgroundColor":
                case "borderColor":
                    toolbarObj = document.getElementById(inputParam);
                    toolbarObj.value = inputValue;
                    break;
                    
                default:
                    new Error("Can't set a non-existent input property.");
            }
        }
    }
}


function inputSetter(x, y, rot, scale, options) {
    var setter = function() {
        if (cycling) {
            return;
        }
        
        
        
        setInput(["x", x],
                 ["y", y],
                 ["rot", rot],
                 ["scale", scale]);
        
        if (options) {
            for (var item in options) {
                setInput(options[item]);
            }
        }
    };

    return setter;
}


function inputSetterFromObj(inputObj) {
    var setter = function() {
        if (cycling) {
            return;
        }
        
        setInput(inputObj);
    };
    
    return setter;
}


// Create initial list of inputs
// Create inputs

window.inputList = [
 {"invertX":false,"invertY":false,"mirrorX":true,"mirrorY":false,"diagNE":false,"diagNW":false,"invertColor":false,"farOut":false,"colorCycle":0.5,"gain":0.5,"borderWidth":0.05,"delay":2,"backgroundColor":"#70b2c5","borderColor":"#000000","x":0,"y":0,"rot":0,"scale":0.8}, 
 {"invertX":false,"invertY":false,"mirrorX":true,"mirrorY":false,"diagNE":false,"diagNW":false,"invertColor":false,"farOut":false,"colorCycle":0.5,"gain":0.5,"borderWidth":0.05,"delay":2,"backgroundColor":"#70b2c5","borderColor":"#000000","x":1.0750000000000002,"y":0,"rot":0.03490658503988659,"scale":0.775},
 {"invertX":false,"invertY":false,"mirrorX":true,"mirrorY":false,"diagNE":false,"diagNW":false,"invertColor":false,"farOut":false,"colorCycle":0.5,"gain":0.5,"borderWidth":0.05,"delay":2,"backgroundColor":"#70b2c5","borderColor":"#000000","x":0.22969924812030057,"y":0.2178757118098539,"rot":0.5235987755982988,"scale":0.8750000000000001},
 {"invertX":false,"invertY":false,"mirrorX":true,"mirrorY":false,"diagNE":false,"diagNW":false,"invertColor":false,"farOut":false,"colorCycle":0.5,"gain":0.5,"borderWidth":0.05,"delay":2,"backgroundColor":"#70b2c5","borderColor":"#000000","x":0.2850753185045946,"y":0.337439135099447,"rot":0.9773843811168251,"scale":0.9000000000000001},
 {"invertX":false,"invertY":false,"mirrorX":true,"mirrorY":false,"diagNE":false,"diagNW":false,"invertColor":false,"farOut":false,"colorCycle":0.5,"gain":0.5,"borderWidth":0.05,"delay":2,"backgroundColor":"#70b2c5","borderColor":"#000000","x":0.3543191852853677,"y":0.17695104841615378,"rot":1.2915436464758048,"scale":0.9000000000000001},
 {"invertX":false,"invertY":false,"mirrorX":true,"mirrorY":false,"diagNE":false,"diagNW":false,"invertColor":false,"farOut":false,"colorCycle":0.5,"gain":0.5,"borderWidth":0.05,"delay":2,"backgroundColor":"#70b2c5","borderColor":"#000000","x":0.6741116966631931,"y":0.049109365366777985,"rot":1.6406094968746712,"scale":0.7},
 {"invertX":false,"invertY":false,"mirrorX":true,"mirrorY":false,"diagNE":false,"diagNW":false,"invertColor":false,"farOut":false,"colorCycle":0.5,"gain":0.5,"borderWidth":0.05,"delay":2,"backgroundColor":"#70b2c5","borderColor":"#000000","x":0.5295287954446296,"y":0.1261266461132166,"rot":2.0943951023931975,"scale":0.725},
 {"invertX":false,"invertY":false,"mirrorX":true,"mirrorY":false,"diagNE":false,"diagNW":false,"invertColor":false,"farOut":false,"colorCycle":0.5,"gain":0.5,"borderWidth":0.05,"delay":2,"backgroundColor":"#70b2c5","borderColor":"#000000","x":0.8432387167997415,"y":0.19935519648274588,"rot":2.3736477827122906,"scale":0.75},
 {"invertX":false,"invertY":false,"mirrorX":true,"mirrorY":false,"diagNE":false,"diagNW":false,"invertColor":false,"farOut":false,"colorCycle":0.5,"gain":0.5,"borderWidth":0.05,"delay":2,"backgroundColor":"#70b2c5","borderColor":"#000000","x":0.43534397995763624,"y":0.4419895119073559,"rot":2.3736477827122906,"scale":0.75},
 {"invertX":false,"invertY":false,"mirrorX":true,"mirrorY":false,"diagNE":false,"diagNW":false,"invertColor":false,"farOut":false,"colorCycle":0.5,"gain":0.5,"borderWidth":0.05,"delay":2,"backgroundColor":"#70b2c5","borderColor":"#000000","x":0.4990160912704009,"y":0.10230147031290185,"rot":2.722713633111157,"scale":0.75},
];