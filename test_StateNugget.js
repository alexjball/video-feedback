var nug = VF.StateNugget.nuggetize;

var makeSG = function() { return nug({
    
    // A simple nugget.
    a : nug({
        
        _ : 2,
        
        get : function() { return this._; },
        
        set : function(x) { this._ = x; }
        
    }),
    
    // This field shouldn't be stripped since it's not an object.
    b : 2,
    
    // This field should be serialized as a string but stored as an object.
    c : nug({
        
        _ : {value : 123123},
        
        get : function() { return this._.value; },
        
        set : function(x) { return this._.value = x; },
        
        toJSON : function(x) { return {value : String(x)}; },
        
        fromJSON : function(x) { return Number(x.value); }
        
    }),
    
    // This field shouldn't be stripped because it isn't a nugget.
    d : { q : 2 },
    
    // This field is a nugget with state and a nested nugget. 
    e : nug({
        
        _ : 45,
        
        get : function() { return this._; },
        
        set : function(x) { this._ = x; },
        
        sube : nug({
            
            get : function() { return Math.random(); },
            
            set : function(x) { return; }
            
        })
        
    })
    
}) };

// Both sg and sg2 have the same structure, so results from one should 
// be applicable to the other.
var sg = makeSG(), sg2 = makeSG();

// A filter for controlling the traversal of the template. 
// fields.indexOf('e') !== -1 blocks saving state for e and its nested nuggets.
// Since the entire tree below e is empty, e should not be included in results.
// By applying the filter to stripNugs, the lack of e should be apparent in
// jsonNugs and deserializedNugs. 
// 
// fields[fields.length - 1] === 'e' only drops the state for e but not sube.
var filter = function(nodes, fields, bases) {
    
    if (fields.indexOf('e') !== -1) { //fields[fields.length - 1] === 'e') {
        
        return VF.StateNugget.dropGo;
        
    } else {
        
        return VF.StateNugget.keepGo;
        
    }
    
}
    // Strip state
var stateNugs        = sg.stripNugs(filter),
    // Convert stripped state to JSON objects.
    jsonNugs         = sg.serializeNugs(stateNugs),
    // Convert JSON objects to strings.
    jsonString       = JSON.stringify(jsonNugs),
    // Convert strings back to JSON objects.
    fromJSON         = JSON.parse(jsonString),
    // Convert JSON objects to state objects.
    deserializedNugs = sg.deserializeNugs(fromJSON);
    
// sg2.a should hold 69, then after applying new nugs, sg2.a should change to 
// the constructed value of 2.

sg2.a.set(69);
sg2.c.set(666);

console.log(sg2.a.get());
console.log(sg2.c.get());

// Transfer state objects from nuggets to sg object.
sg2.applyNugs(deserializedNugs);

console.log(sg2.a.get());
console.log(sg2.c.get());
