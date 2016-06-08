///////////////////////////////
// Application/Time-Independent
///////////////////////////////

var VFApp = function(domParent, viewWidth, viewHeight) {
    
    var app = this;

    var loader = new THREE.ObjectLoader();

    // Get defaults.     
    var dls = defaultLogicalState(viewWidth, viewHeight);
    
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
        
        buildScene(scenes.feedback, feedbackChildren);
        
        if (replaceCurrent === undefined) replaceCurrent = false;
        
        return portal.computeIteration(scenes.feedback, replaceCurrent);
        
    }
    
    this.renderView = function(target) {
        // Render the view, either to the screen (if target is undefined)
        // or to the specified render target.
        
        buildScene(scenes.view, viewChildren, false);

        renderer.render(scenes.view, this.view.camera.get(), target)
        
    }
    
    // Get pixels from portal
    this.readPortalPixels = function(x, y, width, height, buffer, byteOffset) {
        
        if (height === undefined) height = this.portal.resolution.get()[1];
        if (width  === undefined) width  = this.portal.resolution.get()[0];
        if (byteOffset === undefined) byteOffset = 0;
        if (x      === undefined) x = 0;
        if (y      === undefined) y = 0;
        
        var arr;
        if (buffer === undefined) {
            arr = new Uint8Array(width * height * 4);  
        } else {
            arr = new Uint8Array(buffer, byteOffset, width * height * 4);
        }
                
        var ctx = renderer.context;
        
        renderer.setRenderTarget(portal.getStorage());
        
        // We have to read RGBA and UNSIGNED_BYTE according to the standard.
        // Alpha's are set to 255.
        ctx.readPixels(x, y, width, height, ctx.RGBA, ctx.UNSIGNED_BYTE, arr);
        
        return arr.buffer;
        
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
            
    // View methods
    
    this.resizeView = function(width, height) {
        
        // Set the view camera's aspect ratio and the renderer's size.
        // The camera's xy clipping box has area 1.
        
        this.view.resolution.set([width, height]);
        
        var camera = this.view.camera.get();
        
        r = unitAspectRectangle(width, height);
        
        camera.left   = - r.width / 2;
        camera.right  =   r.width / 2;
        camera.top    =   r.height / 2;
        camera.bottom = - r.height / 2;
        
        camera.updateProjectionMatrix();
        
    }
    
    this.portalViewAspect = function() {
        
        // Return the aspect ratio of the portal in the view scene in global
        // coordinates.
        
        buildScene(scenes.view, viewChildren, true);
        
        var pScale = portal.getWorldScale(),
            bb = this.portal.shape.get().boundingBox,
            wPW = pScale.x * (bb.max.x - bb.min.x),
            hPW = pScale.y * (bb.max.y - bb.min.y);
        
        return {
            
            w : wPW,
            
            h : hPW,
            
            aspect : wPW / hPW
                
        };
        
    }
    
    this.setPortalResolutionInView = function(height) {
        
        // Set the portal resolution to have uniform pixel density in the view
        // scene. Width is computed using the density implied by height.
        
        var p = this.portalViewAspect();
        
        this.portal.resolution.set([Math.round(p.aspect * height), height]);
        
    }
    
    this.fitViewToPortal = function() {
        
        // Adjust the view camera to fit the geometry.
        // The camera will be axis aligned.
        
        var camera = this.view.camera.get();
        
        if (camera.parent !== null) {
            
            console.error('The view camera must be a root object.');
            
            return;
            
        }
        
        // Set up the view scene graph and update the portal's view world
        // matrix.
        buildScene(scenes.view, viewChildren, true);
        
        // Bounding box in local coordinates.
        var bb = this.portal.shape.get().boundingBox;
        
        // Transform the bounding box to world coordinates and compute the new
        // min/max of the bounding box.
        var wBB1 = portal.localToWorld(bb.min.clone()),
            wBB2 = portal.localToWorld(bb.max.clone()),
            min  = wBB1.clone().min(wBB2),
            max  = wBB1.clone().max(wBB2);
                
        // Compute the dimensions of the portal bounding box in world coords
        // and that of the camera in local coords. Set the scale of the
        // camera such that the entire portal will be visible.
        var wBB   = max.x - min.x,
            hBB   = max.y - min.y,
            wC    = camera.right - camera.left,
            hC    = camera.top - camera.bottom,
            scale = Math.max(wBB / wC, hBB / hC);
        
        // Center the camera over the portal bounding box, axis-align it,
        // and scale it to fit the portal.
        camera.scale.set(scale, scale, 1);
        camera.position.x = 0.5 * (min.x + max.x);
        camera.position.y = 0.5 * (min.y + max.y);
        camera.rotation.z = 0;
        
    }
    
    this.syncPortalResolution = function() {
        
        // Set the portal resolution by matching the resolution density
        // between the view and the portal.
        
        // Compute the view's pixels per unit in world coordinates.
        
        var camera = this.view.camera.get();

        var wCW = (camera.right - camera.left) * camera.scale.x,
            hCW = (camera.top - camera.bottom) * camera.scale.y,
            res = this.view.resolution.get(),
            ppx = res[0] / wCW,
            ppy = res[1] / hCW,
            ppu = (ppx + ppy) * 0.5;
            
        if (Math.abs((ppx - ppy) / (ppu)) > 1e-3) {
            
            console.warn('The view camera has different pixel densities in x/y.');
            
        }
                
        var p = this.portalViewAspect();
                            
        // Disallow configurations that would induce enormous resolutions
        // relative to the view resolution.
        var maxRelativeScale = 3;
        if (p.w / wCW > maxRelativeScale || p.h / hCW > maxRelativeScale) {
            
            console.error('View-portal relative scale must be less than ' + 
                maxRelativeScale + '.');
            
            return;
            
        }
        
        // Compute the width and height in pixels. Since exact 1:1 texture 
        // can appear blurry regardless of min/mag filters, add a few pixels.
        var height = Math.round(p.h * ppu),
            width  = Math.round(p.w * ppu),
            fudge  = 0;
             
        this.portal.resolution.set([width + fudge, height + fudge]);
                        
    }
            
    function buildScene(scene, children, updateMatrixWorld) {
        
        if (updateMatrixWorld === undefined) updateMatrixWorld = false;
        
        for (var i = 0; i < children.length; i++) {
            
            scene.add(children[i]);
            
        }
        
        if (updateMatrixWorld) scene.updateMatrixWorld();
        
        return scene;
        
    }
    
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
    
    function defaultLogicalState(viewWidth, viewHeight) {
        
        var r = unitAspectRectangle(viewWidth, viewHeight);
                
        var spacemap = new VF.Spacemap();
        spacemap.scale.x = 2;
        spacemap.scale.y = 2;
        
        return {
            
            portalWidth : viewWidth,
            
            portalHeight : viewHeight,

            // Use a rectangle with the same aspect ratio as the screen and 
            // an area of 1.
            portalGeometry : new THREE.PlaneBufferGeometry(r.width, r.height),
            
            portalUVMapping : null,

            spacemap : spacemap,
            
            backgroundColor : 0x70b2c5,
            
            borderColor : 0x0000ff,

            viewWidth : viewWidth,
            
            viewHeight : viewHeight,
                            
            viewCamera : new THREE.OrthographicCamera(
                - r.width / 2, r.width / 2, r.height / 2, - r.height / 2, -100, 100
            ),
                        
            tileDisplay : false,
            
            storage : null
            
        }
        
    }
    
    function unitAspectRectangle(width, height) {
        
        var aspect = width / height,
            w      = Math.pow(aspect, 0.5),
            h      = 1 / w;
        
        return {
            
            aspect : aspect,
            
            width : w,
            
            height : h
                
        }
        
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
        f.view.camera.transfer       = false;
        
        return f;

    },
   
    
    serializeStates : function() {
        
        return this.states;
                
    },
    
    saveState : function(name, toFile) {
        
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
            state : this.app.serializeNugs()
        };
        
        this.states.push(newState);
        
        if (toFile) this.saveStateToFile(newState);
        
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
        
        this.app.applyNugs(this.app.deserializeNugs(toLoad), filter, filterObject);
        
        // Fit the view camera to the geometry.
        app.fitViewToPortal();
        app.syncPortalResolution();
        
    },
    
    saveStateToFile : function(state) {
        
        var width  = this.app.portal.resolution.get()[0],
            height = this.app.portal.resolution.get()[1],
            buffer = this.app.readPortalPixels(0, 0, width, height);
            ppm = toPPM(width, height, toPPM.RGBA, buffer);
            
        var zip = new JSZip();
        var name = state.name;
        
        zip.file(name + '.ppm', ppm);
        zip.file(name + '.state.json', JSON.stringify(state, undefined, 2));

        zip.generateAsync({type : 'blob', compression : 'DEFLATE'})
        .then(function (blob) {
            saveAs(blob, name + '.zip');
        });
        
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

///////////////////////
// Geometry Creation //
///////////////////////

var VFGeometry = function(app) {

    this.app = app;

}

VFGeometry.prototype = {
    
    constructor : VFGeometry,
    
    set : function(geometryConstructor, args) {
        
        var geom = geometryConstructor.apply(this, 
            Array.prototype.slice.call(arguments, 1)
        );
        
        this.app.portal.shape.set(geom);
        this.app.fitViewToPortal();
        this.app.syncPortalResolution();
        
    },
    
    rectangle : function(aspect) {
        
        var width = Math.pow(aspect, 0.5), 
            height = 1 / width;
            
        return  new THREE.PlaneBufferGeometry(width, height);
        
    }
    
}