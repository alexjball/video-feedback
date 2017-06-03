PointerLockOrientationControls = function(element, params) {
    var pointerLockControlsObject = new THREE.Object3D();
    var pointerLockControls = 
        new THREE.PointerLockControls(pointerLockControlsObject);
    pointerLockControls.getObject().position.y = 0;

    var rollObject = new THREE.Object3D();
    var rotateRoll = false;
    rollObject.add(pointerLockControls.getObject());

    var pointerLockHelper = new PointerLockHelper(element, {
        onPointerLockGained : function() {},
        onPointerLockLost : params.onPointerLockLost,
        onPointerLockError : function() {}
    });

    this.start = function() {
        pointerLockControls.enabled = true;
        element.addEventListener("mousedown", onMouseDown, false);
        element.addEventListener("mousemove", onMouseMove, false);
        element.addEventListener("mouseup", onMouseUp, false);
        pointerLockHelper.requestPointerLock();
    }

    this.stop = function() {
        pointerLockControls.enabled = false;
        rotateRoll = false;
        element.removeEventListener("mousedown", onMouseDown, false);
        element.removeEventListener("mousemove", onMouseMove, false);
        element.removeEventListener("mouseup", onMouseUp, false);
        pointerLockHelper.exitPointerLock();
    }

    this.update = function(delta, position, quaternion) {
        rollObject.updateMatrixWorld(true);
        pointerLockControlsObject.getWorldQuaternion(quaternion);
    }

    function onMouseDown(event) {
        if (event.button == 2) {
            rotateRoll = true;
            pointerLockControls.enabled = false;
        }
    }

    function onMouseUp(event) {
        if (event.button == 2) {
            rotateRoll = false;
            pointerLockControls.enabled = true;
        }
    }

    function onMouseMove(event) {
        if (!rotateRoll) return;
        var movementX = 
            event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        rollObject.rotation.z -= movementX * params.rollRadPerPixel;
    }
}

KeyboardMovementControls = function(element, params) {

    var moveForward = false;
    var moveBackward = false;
    var moveLeft = false;
    var moveRight = false;
    var moveUp = false;
    var moveDown = false;
    var moveFast = false;

    this.start = function() {
        document.addEventListener("keydown", onKeyDown, false);
        document.addEventListener("keyup", onKeyUp, false);
    }

    this.stop = function() {
        document.removeEventListener("keydown", onKeyDown, false);
        document.removeEventListener("keyup", onKeyUp, false);
        moveForward = false;
        moveBackward = false;
        moveLeft = false;
        moveRight = false;
        moveUp = false;
        moveDown = false;
        moveFast = false;
    }

    this.update = function(delta, position, quaternion) {
        var velocity = new THREE.Vector3();
        var speed = moveFast ? params.movementSpeed * 3 : params.movementSpeed;

        if (moveForward) velocity.z -= speed;
        if (moveBackward) velocity.z += speed;
        if (moveLeft) velocity.x -= speed;
        if (moveRight) velocity.x += speed;
        if (moveUp) velocity.y += speed;
        if (moveDown) velocity.y -= speed;

        velocity
            .multiplyScalar(delta)
            .applyQuaternion(quaternion)
            .multiply(params.velocityScaleFactor);
        
        position.add(velocity);
    }

    function onKeyDown(event) {
        switch ( event.keyCode ) {
            case 87: // w
                moveForward = true;
                break;
            case 65: // a
                moveLeft = true; break;
            case 83: // s
                moveBackward = true;
                break;
            case 68: // d
                moveRight = true;
                break;
            case 82: // r
                moveUp = true;
                break;
            case 70: // f
                moveDown = true;
                break;
            case 16: // shift
                moveFast = true;
                break;
        }
    }

    function onKeyUp(event) {
        switch( event.keyCode ) {
            case 87: // w
                moveForward = false;
                break;
            case 65: // a
                moveLeft = false;
                break;
            case 83: // s
                moveBackward = false;
                break;
            case 68: // d
                moveRight = false;
                break;
            case 82: // r
                moveUp = false;
                break;
            case 70: // f
                moveDown = false;
                break;
            case 16: // shift
                moveFast = false;
                break;
        }
    }
}

DeviceOrientationControls = function(element) {
    var object = new THREE.Object3D();
    var deviceOrientationControls = new THREE.DeviceOrientationControls(object);
    deviceOrientationControls.disconnect();
    
    this.start = function() {
        deviceOrientationControls.connect();
    }

    this.stop = function() {
        deviceOrientationControls.disconnect();
    }

    this.update = function(delta, position, quaternion) {
        deviceOrientationControls.update();
        quaternion.copy(object.quaternion);
    }
}

ClickMovementControls = function(element, params) {
    var thresholdTime = 300; // ms
    var previousClickTime = -Infinity;
    var direction = 0;

    var onTouchStart = function() {
        var clickTime = performance.now();
        if (clickTime - previousClickTime < thresholdTime) {
            direction = -1;
        } else {
            direction = 1;
        }
        previousClickTime = clickTime;
    }

    var onTouchEnd = function() {
        direction = 0;
    }

    this.start = function() {
        document.addEventListener('touchstart', onTouchStart, false);
        document.addEventListener('touchend', onTouchEnd, false);
    }

    this.stop = function() {
        document.removeEventListener('touchstart', onTouchStart, false);
        document.removeEventListener('touchend', onTouchEnd, false);
    }

    this.update = function(delta, position, quaternion) {
        var velocity = new THREE.Vector3();
        velocity.z -= direction * 2 * params.movementSpeed;
        velocity.multiplyScalar(delta).applyQuaternion(quaternion);
        position.add(velocity);
    }
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

    this.requestPointerLock = function() {
        element.requestPointerLock = 
            element.requestPointerLock 
            || element.mozRequestPointerLock 
            || element.webkitRequestPointerLock;
        element.requestPointerLock();
    }

    this.exitPointerLock = function() {
        document.exitPointerLock = 
            document.exitPointerLock 
            || document.mozexitPointerLock
            || document.webkitexitPointerLock;
        document.exitPointerLock();
    }
}

/**
 * element is the element to attach mouse/wheel events to.
 * camera is the camera that will be managed by this object. The camera is 
 * added to a scene, and its world matrix is updated by this object.
 */
CameraUpdater = function(element, camera) {
   
    var running = false;
    var orientationControl;
    var movementControl;

    this.boundingBox = { 
            min: new THREE.Vector3(-Infinity, -Infinity, -Infinity), 
            max: new THREE.Vector3(Infinity, Infinity, Infinity) 
    },

    this.getOrientationControl = function() {
        return orientationControl;
    }

    this.setOrientationControl = function(control) {
        if (this.isRunning()) {
            console.error('Controls are running, cannot set control when running');
        } else {
            orientationControl = control;
        }
    }

    this.getMovementControl = function() {
        return movementControl;
    }

    this.setMovementControl = function(control) {
        if (this.isRunning()) {
            console.error('Controls are running, cannot set control when running');
            return;
        } else {
            movementControl = control;
        }
    }

    /**
     * two orthogonal control domains: movement and orientation of the camera. 
     * 
     * Movement can either be keyboard-based or click-to-toggle-forward-movement.
     * 
     * Orientation can either be via pointer lock or device orientation.
     * 
     */
    this.start = function() {
        if (this.isRunning()) return;
        if (!movementControl || !orientationControl) {
            console.error('movement or orientation control unset');
            return;
        }
        running = true;
        movementControl.start();
        orientationControl.start();
    }

    this.stop = function() {
        if (!this.isRunning()) return;
        running = false;
        movementControl.stop();
        orientationControl.stop();
    }

    /**
     * Update the camera's position.
     * 
     * Each control is given the position and quaternion of the camera from
     * the previous update. The orientation control is responsible for updating
     * the quaternion and the movement control is responsible for updating the 
     * position.
     */
    this.update = function(delta /* seconds */) {
        if (!this.isRunning()) return;
        var quaternion = (new THREE.Quaternion()).copy(camera.quaternion);
        var position = (new THREE.Vector3()).copy(camera.position);
        orientationControl.update(
            delta, (new THREE.Vector3()).copy(camera.position), quaternion);
        movementControl.update(
            delta, position, (new THREE.Quaternion()).copy(camera.quaternion));
        camera.quaternion.copy(quaternion);
        camera.position.copy(
            position.clamp(this.boundingBox.min, this.boundingBox.max));
        camera.updateMatrixWorld(true);
    }

    this.getPosition = function() {
        return camera.getWorldPosition();
    }

    this.isRunning = function() {
        return running;
    }
}

CameraManager = function(element) {
    var camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 0, 1.5);
    CameraUpdater.call(this, element, camera);

    this.onPointerLockLostCallback = null;
    this.onPointerLockLost = (function() {
        if (this.isRunning()) {
            this.stop();
        }
        if (this.onPointerLockLostCallback) {
            this.onPointerLockLostCallback();
        }
    }).bind(this);
    this.rollRadPerPixel = 0.002;
    this.movementSpeed = .3; // world units per second
    this.velocityScaleFactor = new THREE.Vector3(1, 1, 1);

    var pointerLockOrientationControls = 
        new PointerLockOrientationControls(element, this);
    var keyboardMovementControls = 
        new KeyboardMovementControls(element, this);
    var deviceOrientationControls = 
        new DeviceOrientationControls(element, this);
    var clickMovementControls = 
        new ClickMovementControls(element, this);

    this.resetPosition = function() {
        camera.position.set(0, 0, 1.5);
        camera.rotation.set(0, 0, 0);
    }

    this.setCameraAspect = function(aspect) {
        camera.aspect = aspect;
    }

    this.getCamera = function() {
        return camera;
    }

    this.setMode = function(usePointerLock, useKeyboard) {
        if (usePointerLock) {
            this.setOrientationControl(pointerLockOrientationControls);
        } else {
            this.setOrientationControl(deviceOrientationControls);
        }
        if (useKeyboard) {
            this.setMovementControl(keyboardMovementControls);
        } else {
            this.setMovementControl(clickMovementControls);
        }
    }
}