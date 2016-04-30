var Simulation = function(c_width, c_height) {
    
    var aspect = c_width / c_height;
    
    this.portal_geometry = new THREE.PlaneBufferGEometry(aspect, 1);
    
    this.portal = new VF.Portal()
    
}

Simulation.prototype = {
    
    constructor : Simulation,
    
    getState : function() {
        
        // Returns an object that represents the logical state of the
        // Simulation object.
        
    },
    
    modify : function(options) {
        
        // Modify the logical state of the Simulatio object.
        // options is an object. Fields that match those of logical
        // state variables are used to overwrite those variables.
        // unreferenced state variables are unmodified.
        // The internal state of Simulation is not guaranteed to be
        // consistent with the logical state until resolve is called.
        
    },
    
    resolve : function() {
        
        // Set the internal state of Simulation to match the logical state 
        
    },
    
    render : function() {
        
        // Render the simulation to the screen.
        
    }
    
}