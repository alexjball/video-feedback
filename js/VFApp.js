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
                    
                    return (new VF.Spacemap()).copy(loader.parse(x));
                    
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
            
            fromJSON : function(json) { return loader.parse(json); }
        
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
        
        // mode : nug({
            
            
                
        // }),
        
        // tile : nug({
            
        //     _ : [new THREE.Vector2(1, 0), new THREE.Vector2(0, 1)],
            
        //     set : function(x) { this._ = x },
        //     get : function()  { return this._; },
        //     toJSON : function(x) { 
        //         return [x[0].toArray(), x[1].toArray()];
        //     },
        //     fromJSON : function(json) { 
        //         return [(new THREE.Vector2()).fromArray(json[0]),
        //                 (new THREE.Vector2()).fromArray(json[1])];
        //     }
            
        // })
        
    });
        
    this.background = nug({
        
        // color should be a hex number like 0xff0000
        color : nug({            
            set    : function(c) { background.material.color = new THREE.Color(c); },
            get    : function()  { return background.material.color; },
            toJSON : function(c) { return c.getHex(); }
        })
                
    })
    
    this.border = nug({
                
        color : nug({
            // c is an hex number like 0xff0000
            set : function(c) { border.material.color = new THREE.Color(c); },
            get : function() { return border.material.color; },
            toJSON : function(c) { return c.getHex(); },
        }),
        
        scale : nug({
            // s is an array with [xScale, yScale, zScale] (zScale should be 1).
            // [1, 1, 1] corresponds to a border the same size as the portal 
            // (and won't be visible). [1.1, 1.1, 1] upsizes the border by 10%
            // in each direction.
            set : function(s) { border.scale.fromArray(s); },
            get : function()  { return border.scale },
            toJSON : function(s) { return [s.x, s.y, s.z]; }
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
    
    function setBgSC() {
        
        // TODO
        
    }
    
    function setBgTP() {
        
        // TODO
        
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