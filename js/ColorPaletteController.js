var ColorPaletteController = function(colors, clock /* clock.now() returns current time in ms */) {
    this.baseColors = colors || ColorPaletteController.createGrayscaleColorPalette(30);
    this.texture = new ColorPaletteTexture(this.baseColors);
    this._colorAnimators = [];
    this._isTextureDirty = false;
    this._clock = clock || { now : window.performance.now.bind(window.performance) };
}

/** 
 * colorAnimator is an object with an update(delta, setColor) method.
 * delta is the number of seconds since the last update. 
 * setColor(color, alpha, position) is a function that sets a color
 * at the specified position with the specified alpha. update must 
 * return true when it is done animating.
 */
ColorPaletteController.prototype.addAnimation = function(colorAnimator) {
    this._colorAnimators.push({ 
        prevTime : this._clock.now() * 1e-3, 
        animator : colorAnimator 
    });
}

ColorPaletteController.prototype.update = function() {
    var colors = this.baseColors.map(function() { return []});

    var hasSet = false;
    var setColor = function(color, alpha, position) {
        if (position < colors.length && position >= 0) {
            hasSet = true;
            colors[position].push({
                color : color,
                alpha : alpha,
            })
        }
    }

    var currentTime = this._clock.now() * 1e-3;
    var delta;
    this._colorAnimators = this._colorAnimators.filter(function(a) { 
        var delta = currentTime - a.prevTime;
        a.prevTime = currentTime;
        return !a.animator.update(delta, colors.length, setColor);
    });

    this.texture.colors = this._merge(this.baseColors, colors);

    if (hasSet || this._isTextureDirty) {
        this.texture.uploadColors();
        this._isTextureDirty = hasSet;
    }
}

ColorPaletteController.prototype._merge = function(baseColors, colors) {
    merged = [];
    var mergedColor = new THREE.Color();
    var tmp = new THREE.Color();
    var remainingAlpha;
    var c;
    for (var i = 0; i < baseColors.length; i++) {
        remainingAlpha = 1;
        mergedColor.set(0, 0, 0);
        for (var j = colors[i].length - 1; j >= 0; j--) {
            c = colors[i][j];
            mergedColor.add(tmp.set(c.color).multiplyScalar(c.alpha * remainingAlpha));
            remainingAlpha *= 1 - c.alpha;                
        }
        mergedColor.add(tmp.set(baseColors[i]).multiplyScalar(remainingAlpha));
        merged[i] = new THREE.Color(mergedColor);
    }
    return merged;
}

ColorPaletteController.createGrayscaleColorPalette = function(numColors) {
    var dColor = 1 / Math.max(1, numColors - 1);
    var color = 0;
    var colors = [];
    for (var i = 0; i < numColors; i++) {
        colors[i] = new THREE.Color(color, color, color);
        color += dColor;
    }
    return colors;
}

ColorPaletteController.createRandomColorPalette = function(numColors) {
    var colors = [];
    for (var i = 0; i < numColors; i++) {
        colors[i] = new THREE.Color(Math.random(), Math.random(), Math.random());
    }
    return colors;
}

/**
 * Create a pulse of color that propagates down layers. 
 * 
 * pulseFn has the signature pulseFn(out, pulseAge, animationAge). out is an
 * object { color : THREE.Color, alpha : Number }. pulseFn should set the state
 * of these fields to the color and alpha desired based on the pulseAge and 
 * animationAge. pulseAge is the age in s of the pulse relative to the layer it's
 * being applied to. It is monotonically increasing, and a value of 0 means the
 * pulse wave is centered on the layer. animationAge is the overall age of the 
 * animation, useful for applyiing an overall decay to the animation.
 * 
 * pulseSpeed specifies seconds per layers
 * pulseFn function used to define pulse color and alpha info
 * minAlpha minimum alpha to allow. Setting this to 0 disables 
 *  early stopping, and the pulse must be explicitly marked done by Setting
 *  isDone to true.
 * initialAge age to start the pulse at. This can be used to shift the pulse.
 */
var ColorPulse = function(pulseSpeed, pulseFn, minAlpha, initialAge) {
    this._pulseSpeed = pulseSpeed;
    this._pulseFn = pulseFn;
    this._age = initialAge === undefined ? 0 : initialAge;
    this.minAlpha = minAlpha === undefined ? 0.05 : minAlpha;
    this.isDone = false;
}

/** Return true iff done. */
ColorPulse.prototype.update = function(delta, numColors, setColor) {
    this._age += delta;

    var out = { color : null, alpha : 1 };

    if (this.isDone) {
        return true
    } if (this.minAlpha > 0) {
        var centerPosition = 
            Math.min(Math.max(0, Math.floor(this._age / this._pulseSpeed)), numColors);
        this.isDone = !this._updateRange(centerPosition, numColors, this.minAlpha, setColor)
        this.isDone = !this._updateRange(centerPosition - 1, -1, this.minAlpha, setColor)
            && this.isDone;
    } else {
        this.isDone = !this._updateRange(0, numColors, 0, setColor);
    }
    return this.isDone;
}

ColorPulse.prototype._updateRange = function(start, end, minAlpha, setColor) {
    var out = { color : null, alpha : 1 };
    var changed = false;
    var increment = end > start ? 1 : -1;
    for (var i = start; i != end; i += increment) {
        out.color = new THREE.Color();
        out.alpha = 0;
        this._pulseFn(out, this._age - i * this._pulseSpeed, this._age);
        if (out.alpha >= minAlpha) {
            changed = true;
            setColor(out.color, out.alpha, i);
        } else {
            break;
        }
    }
    return changed;
}

ColorPulse.createBasic = function(color, pulseSpeed) {
    var k = -Math.log(2);
    return new ColorPulse(
        pulseSpeed, 
        function(out, pulseAge, animationAge) {
            out.color.set(color);
            out.alpha = 
                Math.exp(Math.max(0, animationAge) * k / (20 * pulseSpeed)) 
                    * Math.exp(Math.abs(pulseAge) * k / pulseSpeed);
        },
        .01,
        pulseSpeed)
}