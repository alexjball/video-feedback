VF.StateNugget = function() {};

VF.StateNugget.keepGo = 0;
VF.StateNugget.keepStop = 1;
VF.StateNugget.dropGo = 2;
VF.StateNugget.dropStop = 3;

VF.StateNugget.nuggetize = function(object) {
    
    // Mix in StateNugget functionality to an existing object.
    
    object.isNugget        = true;
    object.stripNugs       = VF.StateNugget.prototype.stripNugs;
    object.serializeNugs   = VF.StateNugget.prototype.serializeNugs;
    object.deserializeNugs = VF.StateNugget.prototype.deserializeNugs;
    object.applyNugs       = VF.StateNugget.prototype.applyNugs;
    
    return object;
    
}

VF.StateNugget.createValueNugget = function(object, fieldName) {
    
    return VF.StateNugget.nuggetize({
        
        set : function(x) {
            
            object[fieldName] = x;
            
        },
        
        get : function() {
            
            return object[fieldName];
            
        }
        
    });
    
}

VF.StateNugget.prototype = (function() { 
    
    var isObj = function (o) {
        
        return o !== null && typeof o === 'object';
        
    };
    
    var parseFilter = function(filter) {
        
        if (filter === undefined) {
            
            filter = function() { return VF.StateNugget.keepGo; }
            
        } else if (typeof filter === "number") {
            
            filter = function() { return filter; };
            
        }
        
        return filter;
        
    }
    
    var strip = {
        
        merge : function(nodes, fields, bases) {
                        
            if ('get' in nodes[0]) {
                
                nodes[1].stateNugget = nodes[0].get();
                
            }
                      
        },
        
        pred : function(nodes, fields, bases) {
            
            return nodes[0].isNugget;
            
        }
        
    }
    
    var serialize = {
        
        merge : function(nodes, fields, bases) {
        
            if ('stateNugget' in nodes[2]) {
                
                if ('toJSON' in nodes[0]) {
                    
                    nodes[1].jsonNugget = nodes[0].toJSON(nodes[2].stateNugget);
                    
                } else {
                    
                    nodes[1].jsonNugget = nodes[2].stateNugget;
                    
                }
                                
            }
        
        },
        
        pred : function(nodes, fields, bases) {
            
            // The template should be a state nugget and the tracked state
            // should have the same structure as the template. 
            return nodes[0].isNugget && nodes[2] !== undefined;
            
        }
    
    };
    
    var deserialize = {
        
        merge : function(nodes, fields, bases) {
            
            if('jsonNugget' in nodes[2]) {
                
                if ('fromJSON' in nodes[0]) {
                    
                    nodes[1].stateNugget = nodes[0].fromJSON(nodes[2].jsonNugget);
                    
                } else {
                    
                    nodes[1].stateNugget = nodes[2].jsonNugget;
                    
                }
                
            }
                
        },
        
        pred : function(nodes, fields, bases) {
            
            // The template should be a state nugget and the tracked json
            // should have the same structure as the template. 
            return nodes[0].isNugget && nodes[2] !== undefined;
            
        }
        
    };
    
    var apply = {
        
        merge : function(nodes, fields, bases) {
            
            if ('set' in nodes[0] && 'stateNugget' in nodes[1]) {
                
                nodes[0].set(nodes[1].stateNugget);

            }
            
        },
        
        pred : function(nodes, fields, bases) {
            
            // The template should be a state nugget and the tracked state
            // should have the same structure as the template. 
            return nodes[0].isNugget && nodes[1] !== undefined;
            
        }
        
    };
    
    var startRecurse = function(filter, merge, pred, template, follower, tracked) {
               
        var nodes = Array.prototype.slice.call(arguments, 3),
            fields = [],
            bases = nodes.slice(),
            fns = {
                filter : filter,
                merge  : merge,
                pred   : pred
            };
        
        if (!nodes.every(function(x) { return isObj(x) || x === undefined; })) {
            
            console.error('All structures must either be objects or undefined.');
            
        }
        
        if (!isObj(template)) console.error('template must be an object.');
        
        if (!pred(nodes, [], bases)) return follower;
        
        return recurse(fns, nodes, [], nodes.slice());
        
    };
    
    var recurse = function(fns, nodes, fields, bases) {
        // Recursively traverse the state nuggets of a template object and 
        // modify or construct a follower object.
        //
        // nodes is an array of objects and undefined's.
        // nodes[0] is always an object and corresponds to the template object.
        // nodes[1] can be either and corresponds to the follower object.
        // nodes[2+] can be either and correspond to tracked objects.

        if (!fns.pred(nodes, fields, bases)) return nodes[1];

        var keep, go, condition;
                            
        condition = fns.filter(nodes, fields, bases);

        // If the filter returned a function, replace the filter for successive
        // recursions and assume we should keep state and continue. 
        // Continuation is logical, keeping state is convention.
        if (typeof condition === 'function') {
            
            // Copy fns on write.
            fns = { 
                filter : condition,
                merge  : fns.keep,
                pred   : fns.pred
            };
            
            condition = VF.StateNugget.keepGo;
            
        }
        
        // Whether or not to keep the state of this object (if any).
        keep = condition === VF.StateNugget.keepGo || 
               condition === VF.StateNugget.keepStop;
               
        // Whether or not to continue recursing after this object.
        go   = condition === VF.StateNugget.dropGo ||
               condition === VF.StateNugget.keepGo;
                        
        if (go) {
                        
            var i, tKey, fSubOut, subNodes = Array(nodes.length);
             
            for (tKey in nodes[0]) {
                      
                // Each node is either an object or undefined.
                // Nominally set subNode[i] to node[i][tKey]. If node[i] is
                // undefined or node[i][tKey] is not an object, set
                // subNode[i] to undefined. 
                for (i = 0; i < subNodes.length; i++) {
                    
                    // nodes[i] is either an object or undefined
                    subNodes[i] = nodes[i] !== undefined ? nodes[i][tKey] : undefined;
                    
                    // If the sub node is anything but an object, set it to undefined.
                    // This preserves the condition for nodes in recursive calls.
                    if (!isObj(subNodes[i])) {
                        
                        subNodes[i] = undefined;
                        
                    }
                    
                }
                
                // The template value must be an object.
                if (subNodes[0] === undefined) continue;
                
                // // If tSub passes the predicate...
                // // Can probably move this to the start of the call.
                // if (fns.pred(subNodes, fields, bases)) {
                    
                // We can reuse the same fields object as long as filter doesn't
                // modify it. 
                
                fields.push(tKey);
                
                fSubOut = recurse(fns, subNodes, fields, bases);
                                
                fields.pop();
                
                // Only add a key to the follower object if the traversal of 
                // that key returned an object and the key didn't already exist
                // in followerNode. The first condition is because we should have 
                // fields with values of undefined. The second condition is 
                // becuase the key will already have been update thanks to 
                // reference passing. 
                if (fSubOut !== undefined) {
                            
                    // Set nodes[1] to {} if undefined.
                    nodes[1] = nodes[1] || {};
                    
                    toReplace = nodes[1][tKey];
                    
                    // Only replace nodes[1][tKey] if the value isn't an
                    // object. If nodes[1][tKey] is a defined non-object,
                    // warn that we are overwritting a field.
                    if (!isObj(toReplace)) {
                        
                        if (toReplace !== undefined) {
                            
                            console.warn('Overwritting field ' + tKey);
                            
                        }
                        
                        nodes[1][tKey] = fSubOut;
                        
                    }
                                                                    
                }
                    
                // }

            }
            
        }

        if (keep) {
            
            var oldNode = nodes[1];
            
            nodes[1] = oldNode || {};
            
            fns.merge(nodes, fields, bases);
            
            // Clear out the node if the merge didn't do anything.
            if (oldNode == undefined && 
                    Object.keys(nodes[1]).length === 0) {
                
                nodes[1] = undefined;
            
            }
                    
        }

        return nodes[1];
        
    };

    return {
    
        constructor : VF.StateNugget,
            
        stripNugs : function(filter) {
        
            // Strip the state nuggets out of this object.
            // filter is a function that controls how each field is serialized.
            // filter is called with the current object being stripped, the base
            // object in which the stripping process started, and an array of 
            // fields that specify the path from the base to the current object.
            // fields is empty if base === node.
            // filter should be either one of VF.StateNugget.(keep/drop)State(Continue/Stop) or
            // a function to replace the currently used filter. 
            // filter can also be one of the indicators, in which case that value
            // is used for the entire stripping process.
            
            filter = parseFilter(filter);
                        
            return startRecurse(filter, strip.merge, strip.pred, this, {}); 
        
        },
        
        serializeNugs : function(state, filter) {
            
            if (state === undefined) state = this.stripNugs();
            
            filter = parseFilter(filter);
            
            return startRecurse(
                
                filter, serialize.merge, serialize.pred, this, {}, state
                
            )
            
        },
        
        deserializeNugs : function(json, filter) {
            
            filter = parseFilter(filter);
            
            return startRecurse(
                
                filter, deserialize.merge, deserialize.pred, this, {}, json
                
            )
            
        },
        
        applyNugs : function(state, filter) {
            
            filter = parseFilter(filter);
            
            return startRecurse(
                
                filter, apply.merge, apply.pred, this, state
                
            )
            
        }
        
    }

})();