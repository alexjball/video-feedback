var DemoVrInputController = function() {
    this._fresh = true;

    this.numClicks = 3;
    this.thresholdDuration = 1e3; // ms
    this.touchStartTimes = new Array(this.numClicks);
    this.next = 0;

    document.addEventListener("touchstart", this.touchStartHandler.bind(this), false);
}

DemoVrInputController.prototype.touchStartHandler = function(event) {
    var nextNext = (this.next + 1) % this.numClicks;

    this.touchStartTimes[this.next] = performance.now();
    if (this.touchStartTimes[this.next] - this.touchStartTimes[nextNext] 
            < this.thresholdDuration) {
        app.state3d.controlsController.resetPosition();
    }
    this.next = nextNext;
}