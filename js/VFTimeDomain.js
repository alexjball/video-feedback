var VFTimeDomain = function(app) {
    
    /*
    
    Continuous:
    x
    y
    s
    theta
    border color
    background color
    border width
    gain
    color cycle
    
    Time Domain:
    delay frames
    transition speed
    transition type
    
    */
    
    this.app = app;
    
    this.stateQueue = [];
    
    /*
    
    Use the app to make a dummy copy of the nuggets.
    
    */
        
    /*
    
    Pace functions are used to set the shape of the transition for each
    parameter. Pace functions are function f(t) with t between 0 and 1.
    They specify the blending between the start and end state value. They
    need not be monotonic, but should begin at 0 and end at 1, else the 
    transition will be discontinuous in state space. 
    
    Different continuous parameters have different dimensionalities and
    notions of distance. For example, color is 3d and one can define distance
    either in RGB space or HSV space. spacemaps are at least 4 dimensional
    and distance is qualitatively a weighted euclidian norm. Therefore, it 
    makes sense to define the transition functions and distance metrics on
    the state structure itself, which should be copied from app.
    
    time domain control has state as well, such as delay frames.
    
    */
    
    this.transitionTo = function(appState, time) {
        
        this.app.applyNugs
        
    },
    
    this.distanceTo = function(appState) {
        
        
        
    }
    
    this.setDelayFrames = function(n) {
        
    }
    
    this.animate = function() {
        
    }
    
    this.render = function() {
        
    }
    
    this.stop = function() {
        
    }
    
}