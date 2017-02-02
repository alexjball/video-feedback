Controls3D = function(element, camera) {
    this._camera = camera;
    this._pointerLockControls = new THREE.PointerLockControls(camera);
    this._pointerLockControls.getObject().position.y = 0;
    this._rollObject = new THREE.Object3D();
    this._rollObject.add(this._pointerLockControls.getObject());

    this.rollRadPerPixel = 0.002;
    this.movementSpeed = .025; // world units per second

    this.resetPosition();
    this.stop();

    // Keyboard handlers
    document.addEventListener("keydown", this.onKeyDown.bind(this), false);
    document.addEventListener("keyup", this.onKeyUp.bind(this), false);
    
    // Mouse handlers
    element.addEventListener("mousedown", this.onMouseDown.bind(this), false);
    element.addEventListener("mousemove", this.onMouseMove.bind(this), false);
    element.addEventListener("mouseup", this.onMouseUp.bind(this), false);
}

Controls3D.prototype.isEnabled = function() {
    return this._enabled;
}

Controls3D.prototype.getObject = function() {
    return this._rollObject;
}

Controls3D.prototype.resetPosition = function() {
    this._rollObject.rotation.set(0, 0, 0);
    this._rollObject.children[0].rotation.set(0, 0, 0);
    this._rollObject.children[0].children[0].rotation.set(0, 0, 0);
    this._camera.position.set(0, 0, 1);
    this._camera.rotation.set(0, 0, 0);
}

Controls3D.prototype.start = function() {
    if (this._enabled) return;

    this._pointerLockControls.enabled = true;
    this._enabled = true;
}

Controls3D.prototype.stop = function() {
    if (!this._enabled) return;

    this._pointerLockControls.enabled = false;
    this._enabled = false;
    this._moveForward = false;
    this._moveBackward = false;
    this._moveLeft = false;
    this._moveRight = false;
    this._moveUp = false;
    this._moveDown = false;
    this._rotateRoll = false;
}

Controls3D.prototype.onMouseDown = function(event) {
    if (!this._enabled) return;
    if (event.button == 2) {
        this._rotateRoll = true;
        this._pointerLockControls.enabled = false;
    }
}

Controls3D.prototype.onMouseUp = function(event) {
    if (!this._enabled) return;
    if (event.button == 2) {
        this._rotateRoll = false;
        this._pointerLockControls.enabled = true;
    }
}

Controls3D.prototype.onKeyDown = function(event) {
    if (!this._enabled) return;
    switch ( event.keyCode ) {
        case 87: // w
            this._moveForward = true;
            break;
        case 65: // a
            this._moveLeft = true; break;
        case 83: // s
            this._moveBackward = true;
            break;
        case 68: // d
            this._moveRight = true;
            break;
        case 82: // r
            this._moveUp = true;
            break;
        case 70: // f
            this._moveDown = true;
            break;
        case 27: // escape
            this.stop();
            break;
    }
}

Controls3D.prototype.onKeyUp = function() {
    if (!this._enabled) return;
    switch( event.keyCode ) {
        case 87: // w
            this._moveForward = false;
            break;
        case 65: // a
            this._moveLeft = false;
            break;
        case 83: // s
            this._moveBackward = false;
            break;
        case 68: // d
            this._moveRight = false;
            break;
        case 82: // r
            this._moveUp = false;
            break;
        case 70: // f
            this._moveDown = false;
            break;
    }
}

Controls3D.prototype.onMouseMove = function(event) {
    if (!this._enabled) return;
    var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    this._rollObject.rotation.z -= movementX * this.rollRadPerPixel;
}

Controls3D.prototype.update = function(delta /* seconds */) {
    var velocity = new THREE.Vector3();

    if (this._moveForward) velocity.z -= this.movementSpeed;
    if (this._moveBackward) velocity.z += this.movementSpeed;
    if (this._moveLeft) velocity.x -= this.movementSpeed;
    if (this._moveRight) velocity.x += this.movementSpeed;
    if (this._moveUp) velocity.y += this.movementSpeed;
    if (this._moveDown) velocity.y -= this.movementSpeed;

    this._camera.position.add(velocity.multiplyScalar(delta));
    this._rollObject.updateMatrixWorld(true);
}

PointerLockHelper = function(element, callback) {
    callback = callback || {};
    var havePointerLock = 
            'pointerLockElement' in document 
            || 'mozPointerLockElement' in document 
            || 'webkitPointerLockElement' in document;

    this.isInitialized = havePointerLock;
    if (!havePointerLock) {
        console.warn("Browser doesn't support Pointer Lock API");
        return;
    }

    var pointerlockchange = function ( event ) {
        if (document.pointerLockElement === element 
                || document.mozPointerLockElement === element 
                || document.webkitPointerLockElement === element) {
            if (callback.onPointerLockGained) {
                callback.onPointerLockGained();
            }
        } else {
            if (callback.onPointerLockLost) {
                callback.onPointerLockLost();
            }
        }
    };

    var pointerlockerror = function ( event ) {
        if (callback.onPointerLockError) {
            callback.onPointerLockError();
        }
    };

    // Hook pointer lock state change events
    document.addEventListener( 'pointerlockchange', pointerlockchange, false );
    document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
    document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
    document.addEventListener( 'pointerlockerror', pointerlockerror, false );
    document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
    document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

    this.requestPointerLock = function(callback) {
        element.requestPointerLock = 
            element.requestPointerLock 
            || element.mozRequestPointerLock 
            || element.webkitRequestPointerLock;
        element.requestPointerLock();
    }

    this.exitPointerLock = function(callback) {
        document.exitPointerLock = 
            document.exitPointerLock 
            || document.mozexitPointerLock
            || document.webkitexitPointerLock;
        document.exitPointerLock();
    }
}

Controls3DController = function(element, camera) {
    this.onPointerLockLostCallback = null;
    this.controls = new Controls3D(element, camera);
    this.pointerLockHelper = new PointerLockHelper(element, this);
}

Controls3DController.prototype.start = function(callback) {
    if (this.pointerLockHelper.isInitialized) {
        this.pointerLockHelper.requestPointerLock();
    } else {
        console.warn("Browser doesn't support Pointer Lock API");
    }
}

Controls3DController.prototype.stop = function() {
    if (this.pointerLockHelper.isInitialized) {
        this.pointerLockHelper.exitPointerLock();
    } else {
        console.warn("Browser doesn't support Pointer Lock API");
    }
}

Controls3DController.prototype.onPointerLockGained = function() {
    this.controls.start()
}

Controls3DController.prototype.onPointerLockLost = function() {
    this.controls.stop();
    if (this.onPointerLockLostCallback) {
        this.onPointerLockLostCallback();
    }
}

Controls3DController.prototype.onPointerLockError = function() {
    console.warn("onPointerLockError")
}
