var VFStateManager = function(app, states) {
    // jsonStates is an array of objects of the form
    // { name : "statename", json : {serialized app state}}
    
    this.app = app;
    
    this.states = states;
            
}

VFStateManager.prototype = {
    
    constructor : VFStateManager,
    
    getFilter : function() {

        var f = this.app.copyStructure('transfer', true);
        
        // Making an assumption about the app structure.
        f.portal.resolution.transfer = false;
        f.view.resolution.transfer   = false;
        
        return f;

    },
    
    saveState : function(name) {
        
        var newState = {
            name  : name,
            state : this.app.serializeNugs()
        };
        
        this.states.push(newState);
        
        return newState;
        
    },
    
    loadState : function(toLoad, filterObject) {
        
        var filter = function(nodes) {
            
            if (!nodes[2].transfer) {
                
                return VF.StateNugget.dropStop;
                
            } else {
                
                return VF.StateNugget.keepGo;
                
            }
            
        }
        
        if (typeof toLoad === 'string') {
            
            var found = this.states.find(function(x) { 
                
                return x.name === toLoad;
            
            });
            
            if (found === undefined) {
                
                console.error(toLoad + ' is not a valid state name');
                
                return;
                
            } else {
                
                toLoad = found.state;
                
            }
            
        }
        
        filterObject = filterObject || this.getFilter();
        
        app.applyNugs(app.deserializeNugs(toLoad), filter, filterObject)
        
    }
    
}

var VFSim = function(app, initialDelay, initialDelayCapacity) {
        
    if (initialDelayCapacity === undefined) initialDelayCapacity = 30;
    
    var storage = [];    
    var delay = initialDelay;
    var currentDelay = 0;
    
    this.shouldUpdatePortal = true;
    this.shouldUpdateView   = true;
      
    updateDelayCapacity(initialDelayCapacity);
          
    this.step = function() {
        
        if (this.shouldUpdatePortal) {
            
            iterate();
                    
        }
        
        if (this.shouldUpdateView) {
            
            display();
        
        }
        
    }
    
    this.setDelay = function(newDelay) {
        
        updateDelayCapacity(newDelay);
        
        delay = newDelay;
        
    }
    
    this.getDelay = function() { return delay; }
    
    function updateDelayCapacity(capacity) {
        
        while (storage.length < capacity) {
            
            storage.push(app.createStorage());
            
        }
                
    }
    
    function iterate() {
        
        var currIt, nextIt;
        
        currentDelay = (currentDelay + 1) % delay;
        
        currIt = storage[currentDelay];
        
        app.setPortalStorage(currIt);
        
        nextIt = app.iteratePortal();
        
        app.deleteStorage(currIt);
        
        storage[currentDelay] = nextIt;
        
        app.setPortalStorage(nextIt);
        
    }
     
    function display() {
        
        app.renderView();
        
    }
    
}

