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


// Method: load object to instance
Input.prototype.load = function(inputObj) {
    for (var param in inputObj) {
        var t = typeof inputObj[param];
        if (t == "string" || t == "number" || t == "boolean") {
            this[param] = inputObj[param];
        }
    }
}