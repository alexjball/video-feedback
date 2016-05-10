///////////////////////////////
// Application/Time-Independent
///////////////////////////////

var VFApp = function(domParent, viewWidth, viewHeight) {
    
    var app = this;

    var loader = new THREE.ObjectLoader();

    // Get defaults.     
    var dls = VFApp.defaultLogicalState(viewWidth, viewHeight);
    
    // Create the renderer.
    var renderer;
    setUpRenderer(domParent, dls.viewWidth, dls.viewHeight);

    // Create an allocator for portal render targets.
    var storageManager = new VF.FeedbackStorageManager(
        dls.viewWidth, dls.viewHeight, undefined, renderer
    );
    
    // Create a portal.
    var portal = new VF.Portal(dls.portalGeometry, dls.spacemap, storageManager, renderer);

    // Scene Setup
    
    var border, // Mesh object
        background, // Mesh object
        scenes; // object with fields common, feedback, view, and drawing.
    
    // Populate above. 
    setUpScenes();

    // Store what the children of each scene should be here so we can avoid
    // scene graph conflicts later.
    var feedbackChildren = [scenes.common];
    var viewChildren     = [scenes.common];
        
    var colorPass = new THREE.ShaderPass(ColorShader),
        symPass = new THREE.ShaderPass(SymmetryShader),
        RGBShiftPass = new THREE.ShaderPass(THREE.RGBShiftShader);
    
    // RGBShiftPass gets added by a nug.
    portal.passes = [symPass, colorPass];
    
    // Simulation methods
    
    this.createStorage = function() {
      
        return portal.storageManager.getRenderTarget(true);
          
    };
    
    this.setPortalStorage = function(storage) {
    
        portal.setStorage(storage); 
    
    };
    
    this.getPortalStorage = function() {
        
        return portal.getStorage();
    
    };
    
    this.deleteStorage = function(oldStorage) {
      
        portal.storageManager.recycle(oldStorage);  
        
    };
    
    this.iteratePortal = function(replaceCurrent) {
        
        for (var i = 0; i < feedbackChildren.length; i++) {
            
            scenes.feedback.add(feedbackChildren[i]);
            
        }
        
        if (replaceCurrent === undefined) replaceCurrent = false;
        
        return portal.computeIteration(scenes.feedback, replaceCurrent);
        
    }
    
    this.renderView = function(target) {
        // Render the view, either to the screen (if target is undefined)
        // or to the specified render target.
        
        for (var i = 0; i < viewChildren.length; i++) {
            
            scenes.view.add(viewChildren[i]);
            
        }

        renderer.render(scenes.view, this.view.camera.get(), target)
        
    }
    
    // Logical state variables
    
    nug = VF.StateNugget.nuggetize;
    vNug = VF.StateNugget.createValueNugget;
    
    this.portal = nug({
        
        // This should only be used with geometries
        // supported by the loader. UV mapping is also bound to the geometry.
        // This includes Plange(Buffer)Geometry and CircleGeometry.
        shape : nug({
            set : function(g) { portal.setGeometry(g); border.geometry = g; },
            get : function() { return portal.getGeometry(); },
            toJSON : function(g) { return g.toJSON(); },
            fromJSON : function(json) {
                var loaded = loader.parseGeometries([json]); 
                return loaded[json.uuid];    
            }
        }),
        
        // Specifies the resolution to which the portal is rendered. 
        // For a rectangular portal, this should be at least the resolution
        // of the view.
        // Array of [width, height].
        resolution : nug({
            set : function(res) { portal.storageManager.setSize(res[0], res[1]); },
            get : function() { 
                var s = portal.storageManager; 
                return [s.width, s.height];
            }            
        }),
        
        // an array of Object3Ds specifying the transformation from portal pixels
        // to destination pixels.
        // A reference to the spacemap object can be kept locally and modified. 
        spacemap : nug({
        
            set : function(s) { 
                portal.spacemap = Array.isArray(s) ? s : [s]; 
            },
            
            get : function() { return portal.spacemap; },
            
            toJSON : function(s) { return s.map(function(x) { return x.toJSON() }); },
            
            fromJSON : function(json) { 
                
                return json.map(function(x) { 
                    
                    var obj = loader.parse(x);
                    
                    obj.updateMatrix();
                    
                    return (new VF.Spacemap()).copy(obj);
                    
                });
                
            }
        
        })

    });
    
    this.view = nug({
        
        // Camera object.
        // A camera is created by default, so the view can be controlled
        // by modifying a reference to that camera:
        // var viewCamera = app.view.camera.get();
        // viewCamera.position.x = ##;
        // no need to re-set the camera.
        camera : nug({
        
            _ : dls.viewCamera,
            
            set : function(c) { this._ = c; },
            
            get : function() { return this._; },
            
            toJSON : function(c) { return c.toJSON(); },
            
            fromJSON : function(json) { 
                
                var cam = loader.parse(json);
                
                cam.updateMatrix();
                
                return cam;
            
            }
        
        }),
        
        // Specifies the resolution of the renderer.
        // Array of [width, height]
        resolution : nug({
            set : function(res) { renderer.setSize(res[0], res[1]); },
            get : function() {  
                var s = renderer.getSize(); 
                return [s.width, s.height]; 
            }
        }),

    });
        
    this.background = nug({
        
        // color should be a hex number like 0xff0000
        color : nug({            
            set      : function(c) { background.material.color = new THREE.Color(c); },
            get      : function()  { return background.material.color; },
            toJSON   : function(c) { return c.getHex(); },
            fromJSON : function(c) { return new THREE.Color(c); }
        })
                
    })
    
    this.border = nug({
                
        color : nug({
            // c is an hex number like 0xff0000
            set : function(c) { border.material.color = new THREE.Color(c); },
            get : function() { return border.material.color; },
            toJSON : function(c) { return c.getHex(); },
            fromJSON : function(c) { return new THREE.Color(c); }
        }),
        
        scale : nug({
            // s is an array with [xScale, yScale, zScale] (zScale should be 1).
            // [1, 1, 1] corresponds to a border the same size as the portal 
            // (and won't be visible). [1.1, 1.1, 1] upsizes the border by 10%
            // in each direction.
            set : function(s) { border.scale.copy(s); },
            get : function()  { return border.scale },
            toJSON : function(s) { return [s.x, s.y, s.z]; },
            fromJSON : function(s) { return (new THREE.Vector3()).fromArray(s); }
        })
        
    })
                
    this.effects = nug({
        // All effect fields are convenience for doing
        // *Pass.uniforms[key].value = ###;
        // The values map directly to shader uniform values.
        
        color : nug({
            
            cycle  : vNug(colorPass.uniforms.colorCycle, 'value'),
            invert : vNug(colorPass.uniforms.invertColor, 'value'),
            gain   : vNug(colorPass.uniforms.gain, 'value')
            
        }),
        
        symmetry : nug({
            
            mirrorX : vNug(symPass.uniforms.mirrorX, 'value'),
            mirrorY : vNug(symPass.uniforms.mirrorY, 'value'),
            invertX : vNug(symPass.uniforms.invertX, 'value'),
            invertY : vNug(symPass.uniforms.invertY, 'value'),
            diagNW  : vNug(symPass.uniforms.diagNW,  'value'),
            diagNE  : vNug(symPass.uniforms.diagNE,  'value')
            
        }),
        
        RGBShift : nug({
            
            amount : vNug(RGBShiftPass.uniforms.amount, 'value'),
            angle  : vNug(RGBShiftPass.uniforms.angle,  'value'),
            
            // Enable is true or false.
            enable : nug({
                            
                set : function(v) {
                    
                    if (v && !portal.passes.includes(RGBShiftPass)) {
                        portal.passes.push(RGBShiftPass);
                    } else if (!v && portal.passes.includes(RGBShiftPass)) {
                        portal.passes.pop();
                    }
                    
                },
                
                get : function() { return portal.passes.includes(RGBShiftPass)}
            
            })
            
        })
        
    })
        
    function setUpRenderer(domParent, viewWidth, viewHeight) {
        
        renderer = new THREE.WebGLRenderer( {
            antialias : false,
            stencil   : false,
            depth     : true,
            precision : "highp",
            preserveDrawingBuffer : true,
            autoClear : false
        } );

        if (!renderer) {
            document.body.innerHTML += "oh no webgl";
            console.error('No WebGL supported');
            return;
        }

        renderer.setSize(viewWidth, viewHeight);

        domParent.appendChild( renderer.domElement );
        
    };
    
    function setUpScenes() {
                
        // Scene for objects that are visible in both feedback and view.
        var commonScene = new THREE.Scene();
        
        // Set the background big enough so we never see the edges of it.
        var bgGeometry = new THREE.PlaneBufferGeometry(500, 500);
        var bgMaterial = new THREE.MeshBasicMaterial({color : dls.backgroundColor});
        background = new THREE.Mesh(bgGeometry, bgMaterial);
        background.position.set(0, 0, -1);
        
        // Create the border, which consists of a solid colored border of some
        // thickness surrounded by a solid color background.
        var borderGeometry = portal.getGeometry().clone();
        var borderMaterial = new THREE.MeshBasicMaterial({color : dls.borderColor});
        border = new THREE.Mesh(borderGeometry, borderMaterial);
        border.position.set(0, 0, -.5);
            
        // Add to scene.
        commonScene.add(portal);
        commonScene.add(border);
        commonScene.add(background);
            
        // The scene that contains the drawing overlay.
        var drawingScene = new THREE.Scene();
        
        // The view and feedback scenes. These will both contain commonScene.
        // Anything only in viewScene will not be part of the feedback loop,
        // and anything only in feedbackScene will only be shown in viewScene
        // if it's embedded in the portal's storage.
        var feedbackScene = new THREE.Scene();
        var viewScene     = new THREE.Scene();
        
        scenes = {
            feedback : feedbackScene,
            common   : commonScene,
            view     : viewScene,
            drawing  : drawingScene
        };
                
    }
}

VFApp.defaultLogicalState = function(viewWidth, viewHeight) {
    
    var aspect = viewWidth / viewHeight;
    
    var spacemap = new VF.Spacemap();
    spacemap.scale.x = 2;
    spacemap.scale.y = 2;
    
    return {
        
        portalWidth : viewWidth,
        
        portalHeight : viewHeight,

        portalGeometry : new THREE.PlaneBufferGeometry(aspect, 1),
        
        portalUVMapping : null,

        spacemap : spacemap,
        
        backgroundColor : 0x70b2c5,
        
        borderColor : 0x0000ff,

        viewWidth : viewWidth,
        
        viewHeight : viewHeight,
                        
        viewCamera : new THREE.OrthographicCamera(-aspect / 2, aspect / 2, .5, -.5, -100, 100),
                    
        tileDisplay : false,
        
        storage : null
        
    }
    
}

VF.StateNugget.nuggetize(VFApp.prototype);

/////////////////
// State Manageer
/////////////////

var VFStateManager = function(app, states) {
    // jsonStates is an array of objects of the form
    // { name : "statename", json : {serialized app state}}
    
    this.app = app;
    
    this.states = states;
    
    // this.states = states.map(function(s) {
        
    //     return {
            
    //         name : s.name,
            
    //         state : app.deserializeNugs(s.state)
            
    //     };
        
    // })
            
}

VFStateManager.prototype = {
    
    constructor : VFStateManager,
    
    createFilter : function() {

        var f = this.app.copyStructure('transfer', true);
        
        // Making an assumption about the app structure.
        f.portal.resolution.transfer = false;
        f.view.resolution.transfer   = false;
        
        return f;

    },
   
    
    serializeStates : function() {
        
        return this.states;
        
        // var app = this.app;
        
        // return this.states.map(function(s) {
            
        //     return {
                
        //         name : s.name,
                
        //         state : app.serializeNugs(s.state)
                
        //     }
            
        // })
        
    },
    
    saveState : function(name) {
        
        var states = this.states;
        
        var duplicate = function(n) {
            return states.some(function(x) { return x.name === n; });
        }
        
        if (duplicate(name)) {
            
            name = name + ' ';
            var i = 2;
            
            while (duplicate(name + i)) i++;
    
            name = name + i;
                        
        }
                
        var newState = {
            name  : name,
            state : this.app.serializeNugs() //this.app.deserializeNugs(this.app.serializeNugs())
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
        
        filterObject = filterObject || this.createFilter();
        
        app.applyNugs(app.deserializeNugs(toLoad), filter, filterObject);
        
    }
    
}

/////////////
// Simulation
/////////////

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

////////////////
// State Cycling
////////////////

var VFCycleGenerator = function(app) {
    
    this.app = app;
        
}

VFCycleGenerator.prototype = {
    
    constructor : VFCycleGenerator,
        
    createFilter : function() {

        // var f = this.app.copyStructure('transfer', true);
        
        // // Making an assumption about the app structure.
        // f.portal.resolution.transfer = false;
        // f.view.resolution.transfer   = false;
        // f.effects.color.invert.transfer = false;
        
        var f = this.app.copyStructure('transfer', false);
        
        // Only transfer the position.
        f.portal.spacemap.transfer = true;

        return f;

    },

    createBlending : function() {
        
        var bf = VFCycleGenerator.blendingFunctions;

        var f = this.app.copyStructure('blending', bf.discrete);
                
        // Anything not listed here defaults to discrete blending.
        
        // f.portal.shape.blending            = bf.discreteLatch();
        f.portal.resolution.blending       = bf.continuousArray;
        f.portal.spacemap.blending         = bf.spacemap;
        
        f.view.camera.blending             = bf.camera;
        f.view.resolution.blending         = bf.continuousArray;
        
        f.background.color.blending        = bf.color;
        
        f.border.color.blending            = bf.color;
        f.border.scale.blending            = bf.vector;
        
        f.effects.color.cycle.blending     = bf.continuousNumber;
        f.effects.color.gain.blending      = bf.continuousNumber;
        
        f.effects.RGBShift.amount.blending = bf.continuousNumber;
        f.effects.RGBShift.angle.blending  = bf.continuousNumber;        
        
        return f;

    },
    
    createTransitions : function() {
        
        var f = this.app.copyStructure('transition', 
            VFCycleGenerator.transitionFunctions.linear);
                
        return f;

    },
    
    createCycle : function(startState, endState, filterObj, transitions, blending) {
        // startState and endState should be valid input to app.applyNugs.
        // Other objects should not modify startState/endState while the cycle
        // is acting.
        
        filterObj   = filterObj   || this.createFilter();
        transitions = transitions || this.createTransitions();
        blending    = blending    || this.createBlending();
        
        var app = this.app;
        
        var filter = function(nodes) {
            
            if (!nodes[3].transfer) {
                
                return VF.StateNugget.dropGo;
                
            } else {
                
                return VF.StateNugget.keepGo;
                
            }
            
        }
        
        var getMerge = function(t) {
            
            return function(nodes) {
                
                var aNode = nodes[0], 
                    sNode = nodes[1], 
                    eNode = nodes[2],
                    tNode = nodes[4],
                    bNode = nodes[5]; 
                
                if ('set' in aNode) {
                                            
                    bNode.blending(
                        
                        aNode, sNode.stateNugget, eNode.stateNugget, tNode.transition(t)
                        
                    )
                    
                }
                
            }
        
        }
        
        var pred = function(nodes) {
            
            // Only follow structure that is shared between the app (template),
            // start, and end states.
            return nodes[0].isNugget && 
                nodes[1] !== undefined && nodes[2] !== undefined;
            
        }
        
        // Return a function that applies the state at t \in [0, 1]
        // t = 1 corresponds to the target state, t = 0 corresponds to the
        // start state.
        return new VFCycle(function(t) {
            
            app.processNugs(
                
                filter, getMerge(t), pred, startState, endState, filterObj, transitions, blending
                
            )
            
        });
        
    }
    
}

VFCycleGenerator.transitionFunctions = {
    
    linear : function(t) { return t; }
    
}

VFCycleGenerator.blendingFunctions = (function(){
    
    function lerpObject3D(toLerp, end, b) {
                    
        toLerp.position.lerp(end.position, b);
        
        toLerp.scale.lerp(end.scale, b);
        
        toLerp.rotation.setFromVector3(
            
            toLerp.rotation.toVector3().lerp(end.rotation.toVector3(), b)
            
        )
                
        return toLerp;
        
    }
    
    function lerpNumber(s, e, b) {
        
        return s + b * e;
        
    }

    return {
    
        continuousNumber : function(x, start, end, b) {
            
            x.set(lerpNumber(start, end, b));
            
        },
        
        continuousArray : function(x, start, end, b) {
            
            x.set(start.map(function(y, i) { return lerpNumber(y, end[i], b); }));
            
        },
        
        color : function(x, start, end, b) {
            
            x.set(start.clone().lerp(end, b));
            
        },
        
        vector : function(x, start, end, b) {
            
            x.set(start.clone().lerp(end, b));
            
        },

            
        spacemap : function(x, start, end, b) {
            
            var lerped = Array(start.length);
            
            for (var i = 0; i < lerped.length; i++) {
                
                lerped[i] = lerpObject3D(start[i].clone(), end[i], b);
                
            }

            x.set(lerped);
            
        },
        
        camera : function(x, start, end, b) {
            
            // Should only be used with orthographic cameras.
            
            if (start instanceof THREE.OrthographicCamera === false) {
                console.error('start and end must be orthographic cameras');
                return;
            }
            
            var lerped = start.clone();
            
            lerpObject3D(lerped, end, b);
            
            var fields = ['near', 'far', 'left', 'right', 'top', 'bottom', 'zoom'];
            
            for (var i = 0; i < fields.length; i++) {
                
                lerped[fields[i]] = lerpNumber(start[fields[i]], end[fields[i]], b);
                
            }
            
            lerped.updateProjectionMatrix();
            
            x.set(lerped);
            
        },
        
        discreteLatch : function() {
            
            var latched = false;
            
            return function(x, start, end, b) {
            
                if (b > 0.5 && !latched) {
                    
                    x.set(end);
                    
                    latched = true;
                    
                }
                
            }
            
        },
        
        discrete : function(x, start, end, b) {
            
            if (b > 0.5) {
                
                x.set(end);
                
            } else {
                
                x.set(start);
                
            }
            
        }
    
    }
    
})();

///////////////
// Cycle Timing
///////////////

VFCycle = function(cycleFn, speed) {
    
    this.speed = speed === undefined ? 1 / 60 : speed;
    this.t     = 0;
        
    var lastRenderedT  = 0;
    var maxT = 1;
    
    this.step = function() {
        
        if (this.done()) return true;
        
        if (this.t > maxT) this.t = maxT;
        
        cycleFn(this.t);
        
        lastRenderedT = this.t;
        
        this.t += this.speed;
        
        return this.done();
                
    }
    
    this.done = function() { return lastRenderedT === maxT && this.t >= maxT; }
        
}