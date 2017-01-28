// oldFramesToRender = null;
// framesToRender = Infinity;

function init() {
    
    // alert("innerWidth = " + window.innerWidth + " innerHeight = " + window.innerHeight);
    // alert("clientWidth = " + document.documentElement.clientWidth + " clientWidth = " + document.documentElement.clientHeight);

    var v = getViewportResolution();
    app = new VFApp(document.getElementById('simulation-canvas'), v.width, v.height);
    sim          = new VFSim(app, 10, 30);
    geo          = new VFGeometry(app);
    
    var localStorageKey = "videoFeedbackStates";
    isNewInstance = !localStorage.getItem(localStorageKey);
    
    // Set initial states if none have been set. 
    if (isNewInstance) {
        seedLocalStorage(localStorageKey);
    }
    
    stateManager = new VFStateManager(app, localStorageKey);
    
    // Global state for cycling because now.
    cycleGen     = new VFCycleGenerator(app);
    cycleQueue   = [];
    cycleSpeed   = .005;
    cycleEndCallback = null;
    vfr          = new VFRenderer();
    
    stats = new Stats();
    stats.showPanel(0);
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '0px';
    stats.dom.style.display = "none";
    document.body.appendChild(stats.domElement);
        
    // Load the default state, which includes border width and symmetries.
    stateManager.loadState('Default');
    
    // Set the geometry to match the aspect ratio of the window.
    geo.set(geo.rectangle, v.width / v.height);

    window.addEventListener( 'resize', onWindowResize, false );

    loadFromHash();

}

function getViewportResolution() {
    var scale = window.devicePixelRatio || 1;
    return {
        scale : scale,
        width : Math.round(window.innerWidth * scale),
        height : Math.round(window.innerHeight * scale)
    };
}

function onWindowResize() {
    var v = getViewportResolution();
    app.resizeView(v.width, v.height);
    app.fitViewToPortal();
}

function showAbout() {
    
    document.getElementById('about').style.display = 'block';
    
}

function hideAbout() {
    
    document.getElementById('about').style.display = 'none';
    
}

function loadFromHash() {
    
    // Get the hash without the #.
    var str = window.location.hash.slice(1);
    
    if (str.length == 0) return;
    
    try {
        
        var state = JSON.parse(atob(str));
        
        stateManager.loadState(state);

    } catch (e) {
        
        console.error("Couldn't load state from URL.");
        
    }    
    
}

function saveToHash() {
    
    var hash = btoa(JSON.stringify(app.serializeNugs()));

    window.location.hash = hash;
    
    // var currURL = window.location.href;
    // var end = currURL.indexOf('#');
    
    // if (end == -1) end = currURL.length;
    
    // return currURL.slice(0, end) + '#' + hash;
    
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
        
        if (this.state === VFRenderer.states.stop) return;
        
        this.framesToRender = 0;
        this._oldframesToRender = 0;
        this.state = VFRenderer.states.stop;
        cycleQueue = [];
        cycleEndCallback = null;
        
    },
    
    pause : function() {
        
        if (this.state !== VFRenderer.states.play) return;
        
        this._oldframesToRender = this.framesToRender;
        this.framesToRender = 0;
        this.state = VFRenderer.states.pause;
        
    },
    
    play : function() {
        
        switch (this.state) {
            
            case VFRenderer.states.play:
                this.framesToRender = Infinity;
                break;
            case VFRenderer.states.stop:
                this.framesToRender = Infinity;
                this.state = VFRenderer.states.play;
                break;
            case VFRenderer.states.pause:
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
            
            cycleQueue[0].speed = cycleSpeed;
            
            if (cycleQueue[0].step()) {
                
                cycleQueue.shift();

                sim.step();

                cycleEndCallback();
                
                requestAnimationFrame(render);

                return;
                
            }
            
        }
        
        sim.step();

        if (vfr.framesToRender == 0) vfr.stop();
                
        stats.end();

    }
    
    requestAnimationFrame(render);
    
}
