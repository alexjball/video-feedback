function initializeCycler() {
    window.inputIndex = 0;
    window.cycleHandler = 0;

    window.nextInputEvent = new CustomEvent("slideFinished");
    document.addEventListener("slideFinished", slideFinishedHandler, false);
}


function slideFinishedHandler(event) {
    if (inputIndex <= inputList.length - 1) {
            cycleHandler = cycleInputs();
    }
    else {
        inputIndex = 0;
        cycleInputs();
    }
}


// cycle through inputList
function cycleInputs() {
    window.userInputOn = false;
    
    if (inputIndex == 0 && !window.cycling) {
        
        // start from screen
        var currentInput = new Input(inputs);
        var nextInput = inputList[(inputIndex) % (inputList.length)];
    }
    else {
        var currentInput = inputList[inputIndex];
        var nextInput = inputList[(inputIndex + 1) % (inputList.length)];
        
        // Input index overflow will be handled by the slideFinishedHandler.
        inputIndex++;
    }
    
    window.cycling = true;

    window.steps = Math.round(getInput("beatLength")) / 10;
    var timeout = 10;

    var repeat, loopID;
    var i = 1;

    var repeat = function(input1, input2) {
        // update parameters by i
        var x = ((steps - i) * input1["x"] + i * input2["x"]) / steps;
        var y = ((steps - i) * input1["y"] + i * input2["y"]) / steps;
        var rot = ((steps - i) * input1["rot"] + i * input2["rot"]) / steps;
        var scale = ((steps - i) * input1["scale"] + i * input2["scale"]) / steps;
        
        setInput(["x", x], 
                 ["y", y], 
                 ["rot", rot], 
                 ["scale", scale]);

        i++;

        if (i >= steps) {
            i = 1;

            // When done, throw nextInputEvent. cycleInputs() will be called again
            document.dispatchEvent(nextInputEvent);
            clearInterval(loopID);
        }
    };

    var loopID = setInterval(repeat, timeout, currentInput, nextInput);

    return loopID;
}