/*
Input = function() {
    this.x = 0;
    this.y = 0;
    this.rot = 0;
    this.scale = 0.5;
    
    this.get = function(field) {
        return this[field];
    };
    
    this.set = function(field, value) {
        this[field] = value;
    };
    
    this.loadSpacemap = function(sm) {
        // CCW rotation "as it appears"
        this.rot = -sm.rotation.z;

        // Can use spacemap.scale.y here (should be the same)
        this.scale = 1 / sm.scale.x;

        this.x = (-this.scale) 
            * (Math.cos(this.rot) * sm.position.x
               - Math.sin(this.rot) * sm.position.y);
        this.y = (-this.scale) 
            * (Math.sin(this.rot) * sm.position.x
               + Math.cos(this.rot) * sm.position.y);
    };
    
    this.updateSpacemap = function(sm) {
            sm.position.x = 0;
            sm.position.y = 0;
            
            sm.rotation.z = -this.rot;
            sm.scale.x = 1 / this.scale;
            sm.scale.y = 1 / this.scale;
            
            sm.position.x = 
                -(1 / this.scale) 
                    * (Math.cos(-this.rot) * this.x 
                       - Math.sin(-this.rot) * this.y);
            sm.position.y = 
                -(1 / this.scale) 
                    * (Math.sin(-this.rot) * this.x 
                       + Math.cos(-this.rot) * this.y);
        };
};
*/

function getInput(field) {
    var sm = app.portal.spacemap.get()[0];
    switch(field) {
        case "x":
            var scale = getInput("scale");
            var rot = getInput("rot");
            return (-scale) 
            * (Math.cos(rot) * sm.position.x
               - Math.sin(rot) * sm.position.y);
        case "y":
            var scale = getInput("scale");
            var rot = getInput("rot");
            return (-scale) 
            * (Math.sin(rot) * sm.position.x
               + Math.cos(rot) * sm.position.y);
        case "rot":
            return -sm.rotation.z;
        case "scale":
            return 1 / sm.scale.x;
        default:
            console.log("invalid field");
            break;
    }
}


function setInput() {
    var sm = app.portal.spacemap.get()[0];
    
    var x = getInput("x");
    var y = getInput("y");
    var rot = getInput("rot");
    var scale = getInput("scale");
    
    for (var arg in arguments) {
        var field = arguments[arg][0];
        var value = arguments[arg][1];
        
        switch(field) {
            case "x":
                x = value;
                break;
            case "y":
                y = value;
                break;
            case "rot":
                rot = value;
                break;
            case "scale":
                scale = value;
                break;
            default:
                console.log("invalid field");
                break;
        }
        
        // Now set the spacemap
        sm.position.x = 0;
        sm.position.y = 0;

        sm.rotation.z = -rot;
        sm.scale.x = 1 / scale;
        sm.scale.y = 1 / scale;

        sm.position.x = -(1 / scale) * (Math.cos(-rot) * x 
                                       - Math.sin(-rot) * y);
        sm.position.y = -(1 / scale) * (Math.sin(-rot) * x 
                                       + Math.cos(-rot) * y);
    }
}


userInputOn = true;

inputSettings = {
        scale : -1,
        rotStep : -2 * Math.PI / 180.0,
        zStep : .025,
        xyStep : -.025
    };













