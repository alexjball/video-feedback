oldFramesToRender = null;
framesToRender = Infinity;

function init() {
    
    app          = new VFApp(document.body, window.innerWidth, window.innerHeight);
    stateManager = new VFStateManager(app, DefaultAppStates);
    sim          = new VFSim(app, 10, 30);
    cycleGen     = new VFCycleGenerator(app);
    cycleQueue   = [];
    vfr          = new VFRenderer();
    
    stats = new Stats();
    stats.showPanel(0);
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '0px';
    document.body.appendChild(stats.domElement);
    
}

var VFRenderer = function() {
    // This is really hacky...
    
    this.state = VFRenderer.states.stop;
    this.framesToRender = 0;
    this._oldframesToRender = 0;
    this.cycleQueue = [];
    
}

VFRenderer.states = {
    
    stop  : 0,
    play  : 1,
    pause : 2
    
}

VFRenderer.prototype = {
    
    stop : function() {
        
        // if (this.state === VFRenderer.states.stop) return;
        
        this.framesToRender = 0;
        this._oldframesToRender = 0;
        this.state = VFRenderer.states.stop;
        cycleQueue = [];
        
    },
    
    pause : function() {
        
        if (this.state !== VFRenderer.states.play) return;
        
        this._oldframesToRender = this.framesToRender;
        this.framesToRender = 0;
        
    },
    
    play : function() {
        
        switch (this.state) {
            
            case VFRenderer.states.play:
                return;
            case VFRenderer.states.stop:
                this.framesToRender = Infinity;
                this.state = VFRenderer.states.play;
                break;
            case VFRenderer.state.pause:
                this.framesToRender = this._oldframesToRender;
                this.state = VFRenderer.states.play;
                break;

        }
        
    }
    
}

function render() {
    
    if (vfr.framesToRender > 0) {
        
        vfr.framesToRender--;   

        stats.begin();
            
        updateUI();
        
        if (cycleQueue.length > 0) {
                                    
            if (cycleQueue[0].step()) cycleQueue.shift();
            
        }
        
        sim.step();
        
        stats.end();

    }
    
    requestAnimationFrame(render);
    
}