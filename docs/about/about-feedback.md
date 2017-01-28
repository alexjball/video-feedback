# Video Feedback

Feedback is the process of piping information (directly or indirectly) from a system's output to its input. 

Video systems are open systems that produce time-varying visual output.  

## An Experiment

The motivation for this project came from playing with real-life camera-monitor feedback. An intuitive understanding of such systems proved invaluable when formalizing and extending video feedback in software. So, below are quick-and-dirty instructions for setting up [an effective video feedback system](https://www.youtube.com/watch?v=ulPmf6ZPPwI) using a camera and VLC:

1. Plug in the camera and open VLC
2. Start the camera video stream
    - Go to `File>Open Capture Device...`
    - Choose `Capture Mode>DirectShow`
    - Select the webcam for `Video device name`
    - Select `None` for `Audio device name`. 
    - Adjust the video aspect ratio under `Advanced options...`.
    - Press `Play` and a window should appear with the stream. 
3. Orient your camera to achieve a "picture-in-picture" effect. Try to keep the camera's focal plane parallel with the plane of the monitor.
4. Adjust video color and effects under `Tools>Effects and Filters>Video Effects` or, if available, using utility programs provided with your camera.
    - Start by tweaking the `Essential>Image adjust` settings so that colors don't change when fed back through the system (e.g. nested images are the same color as the parent image). It may be easier to adjust your camera's sensor settings directly.
    - Try increasing the saturation slightly so that iterated colors are driven toward saturated colors.
    - Try increasing the contrast to make edges more pronounced.
    - Try negating colors on each iteration with `Colors>Negate colors`. This drives colors toward black and white, but other orbits are possible.
    - Try mirroring the image with `Advanced>Mirror`.

### What's Happening?

Well, the camera's position, orientation, and magnification (scaling) factors define its view of the world. This view includes anything inside the camera's [viewing frustum](https://en.wikipedia.org/wiki/Viewing_frustum), which is a rectangular pyramid that specifies what the camera can see. So, whatever's inside the frustum gets digitized by the camera's sensor and transfered as an array of pixels to VLC. This processing and transfer can produce a time delay between between sensor record and image display, which affects how long the system takes to settle.

VLC then modifies the pixels by applying local and global effects. Local effects are functions that transform a given pixel using only its previous value and those of other pixels in its neighborhood. Global effects can source new pixel data from arbitrarily far away. Local effects include saturation, color correction, color negation, and blurring. Global effects include mirroring.

Finally, VLC renders the pixels to screen. In order to produce feedback, these pixels must be within the camera's view.

We can simplify our analysis by assuming that the camera's focal/near/far plane is parallel with the plane of the monitor. Then, what the camera sees in the plane of the monitor is specified by a (rotated) rectangle. Also, we can specify how the camera's view gets rendered to the monitor with another rectangle (which is axis-aligned if we assume the monitor is). 

![When the camera is aligned with the monitor, its view of the monitor plane can be specified as a rectangle](./img/aligned-view.png)

Note that the illustration might behave opposite what one would expect: When the camera is translated left, the rendered image appears to move right. This is because the rendered image shows what the camera sees, and in the camera's frame, the monitor appears to move right as we move the camera left.

## Experimental Phase Space

To summarize the previous section, the interesting bits of the experiment were:

1. The position, orientation, and size of the monitor and camera rectangles
2. The local and global pixel transformations
3. The record-render delay

We also know, from the experiement, that many for many configurations of the above bits, the rendered view eventually settles to some kind of pattern. The shape of this pattern is affected by the camera/monitor rectangles and by mirror symmetries (global effects). Changing the delay affects the time it takes the system to settle, but not the final pattern. Changing local transformations can dramatically affect the appearance of patterns by changing how edges are emphasized, but the pattern's overall structure is unchanged under such transforms.

Aside from these interesting configurations, there are many more that either settle too quickly (e.g. if the monitor and camera rectangles don't overlap sufficiently) or "explode": large two-dimensional regions that lose detail or strobe, depending on the local color transform.

We can make sense of all this by separating the system into three components:

1. Rearrangement of space. Each destination point in the monitor is updated with the information at a source point somewhere else. 
2. Pointwise transforms of world information, e.g. local color transforms.
3. Time propagation, e.g. the time between successive feedback iterations.

The first component has empirically proved to be the meat of the system; as discussed above, it determines the fundamental pattern structure, and is what we'll use to classify different system configurations.

## Two-Rectangle Phase Space

Rearrangement of space was specified in the experiment by the physical positions, orientations, and scalings of the monitor and camera. We can clean this up a bit by noting that we only need the absolute position of one rectangle, and the position, orientation, and scaling of the other relative to it. Since the camera is moved in the experiment, it is natural to define the monitor position absolutely and the camera's relative to it. Furthermore, the camera's position, orientation, and scaling can be combined into a single affine transformation that specifies how to transform a coordinate in the monitor or *destination* to one in the camera's view or *source*. Conveniently, affine transformations are composable, and this abstraction works nicely with scene graphs in graphics frameworks. 

So, now the underlying structure of the system is a function of the monitor rectangle and an affine transformation.

## Characterizing the Two-Rectangle Phase Space

We are now in a position to more rigorously address what makes configurations "interesting". For contractive configurations (where each rendered image is smaller than the view) of this system,  we either observe a finite number of iterations or an infinite number of iterations which converge to a single point. It helps to think of the trajectory of points as they are mapped through the system. All stable configurations initially source points from outside the system, e.g. from the area outside the monitor. These trajectories either terminate after a finite number of iterations or asymptotically approach a single *attractor* point. Since all points near the attractor map towards the attractor, and the mapping is well-defined for any source point, the attractor must map to itself. That is, the attractor is a *fixed point* of the system.

So, for the two-rectangle system, points in phase space are associated with either zero or one fixed points.

## Any Monitor We Want: Portals

If we examine a region of phase space that includes both types of configurations, it is obvious that there is a smooth transition from "no fixed point" to "one fixed point". Intuitively, we would expect that increasing the size of the monitor while keeping the affine transformation the same would "uncover" the fixed point. 

If we got a larger monitor, say, one that covers all space, there wouldn't be anything for the monitor extents to obscure, so we'd expect to see a fixed point whenever the affine transformation has a fixed point. *All contractive affine transformations have exactly one fixed point*, so we'd *always* observe a fixed point in this case. 

So, really, the interesting part about the two-rectangle system is the choice of affine transformation, and the monitor acts as a "view" into the feedback loop. Furthermore, there is no reason that the monitor needs to be a rectangle; we used a rectangle simply because that's how real camera sensors work. Therefore, we can expand our concept of monitors to include general regions of space, which we'll call *portals*. The system is "interesting" if the fixed point of the affine transformation is within the portal. 

Since we're normally only interested in interesting configurations, and the portal is trivial to manipulate, we can regard the "essence" of the feedback system to be the information in the affine transformation itself.

If you are familiar with [iterated function systems](https://en.wikipedia.org/wiki/Iterated_function_system), the main difference between them and video feedback is that in video feedback you observe both the fixed set *and* the convergence toward the fixed set.

## What about Mirroring? Spacemaps

Previously, we had described mirroring using global pixel transformations, that is, a transformation of the portal's source view. Clearly, though, mirroring can change the fixed point structure of the system. Since mirror symmetries effectively branch the source view (a single point in the source can be mapped to multiple points in the destination), multiple or even inifinite fixed points may be present, inducing a *fixed set*.

This is not necessarily unsurprising, given that mirror symmetries *are* a rearrangement of space, and can be specified using affine transformations. It turns out that we can express arbitrary rearrangements of space (if we're okay with linear approximations) with *piecewise affine transformations*.

In the two-rectangle system, a single affine transformation was used to map every destination point in space to a source point. To encode mirror symmetries, we partition space into a set of (possibly unbounded) polygonal faces and assign an affine transformation to each one. Every point in a given face is mapped to its source using the associated affine transformation. We'll call these partitions and their associated transforms *spacemaps*.

The simplest spacemap has a single unbounded face that covers all space and is associated with the identity transform. The affine transformation used in the two-rectangle system has the same face but a nontrivial associated transform. A spacemap that corresponds to `(x, y) -> (x, y) if x < 0, else (-x, y)`, i.e. mirroring about the `y` axis, would use two unbounded faces separated by the `y` axis. The left half-plane would have an identity transformation, and the right half-plane would simply scale `x` by -1.

Note that while affine transformations are one-to-one, spacemaps are not necessarily so. For example, the mirroring spacemap maps both destination half-planes onto the left source half-plane. Thus, spacemaps must specify the transformation from the destination to the source to ensure they are functions. This was just convention for single affine transformations.

Affine transformations were nice because they were closed under composition, so they could be chained together. Since the codomain of a spacemap is a subset of the domain (all space) of any spacemap, composition is well-defined. Also, since affine transformations preserve points and lines, the composition of two spacemaps is itself a spacemap, and spacemaps are also closed under composition.

Implementing arbitrary piecewise transforms efficiently and integrating that into a rendering pipeline is not low hanging fruit, so the above concept is currently only useful for analysis. Look [here](http://doc.cgal.org/latest/Arrangement_on_surface_2/index.html#arr_secarr_class), [here](http://www.cs.uu.nl/docs/vakken/ga/slides2a.pdf), and [here](https://www.cise.ufl.edu/class/cot5520fa09/CG_MapOverlay.pdf) for some implementation guidance. 

## Characterizing Fixed Sets Under Symmetries

fixed sets are interesting due to their shape as well as how points are mapped within the set under the governing mapping rules. Iterated function systems visualize the shape of the fixed set, while [electric sheep](https://en.wikipedia.org/wiki/Electric_Sheep) also visualizes trajectories within the fixed set. In that spirit, we can characterize the fixed sets produced by more complicated video feedback systems (i.e. those with symmetries) and motivate trajectory coloring within fixed sets. Remember, most of what we observe are converging trajectories *toward*, not in, the fixed set (which is why everything appears to shrink toward a core pattern).

We can visualize fixed sets to some extent as follows: the background color is set to black, and the border color is set to off-white with a slightly reddish tint. The “Color Cycle” effect is turned off, so the hue does not change with iteration depth. The gain effect highlights the fixed point by turning pixels red after a large number of iterations. Since trajectories converge toward the fixed set, the fixed set should be surrounded by such pixels.

![No symmetry, fixed point][fs-point]
With no symmetry, the fixed set is a single point, as with the two-rectangle system.

![x-symmetry, unrotated, fixed set is a line segment][fs-line]
With the spacemap translated left and a mirroring the across the `y` axis, the fixed set has expanded into a line segment, evidenced by the red line. The border converges uniformly toward the segment. The left half of the segment is sourced from its neighborhood (pixels in "sub-infinite" iterations). The right half of the segment is sourced directly from the left half. Therefore, once a point reaches the left half of the fixed set (after an infinite number of iterations), it stays there, additionally branching off to right half of the segment.

![x-symmetry, small rotation, fixed set curves][fs-curved-line]
As a rotation is applied to the configuration, the fixed set begins to curve. The sourcing analysis remains the same, but pixel branching between iterations is now visible in the bottom side of the border as kinks are duplicated toward the fixed set.

![x-symmetry, medium rotation, mushroom-y thing][fs-mushroom]
![x-symmetry, large rotation, 1d fractal structure][fs-1d-fractal]
Larger rotations increase the effect of branching. It is no longer clear whether the points in the fixed sets are sourced from their neighborhoods, as the distance pixels are mapped increases toward the fixed set. Fractal structure can also be seen, in which the "length" of the fixed set grows unbounded. 

![x-symmetry, 2d fractal][fs-2d-fractal]
![x-symmetry, 2d saturated structure][fs-2d-fractal]
In some configurations, the fixed set can appear to occupy two-dimensional space. Comparing images, the first exhibits the same space filling properties as other two-dimnsional fractals like the [Sierpinski triangle](https://en.wikipedia.org/wiki/Sierpinski_triangle). That is, there is always "non-fractal" between any two points in the fractal (the fixed set has measure zero). In the second image, the fixed set appears to occupy a contiguous region. We suspect that these fixed sets are also measure zero, but because of limited simulation resolution, they are effectively contiguous. 

Both types of two-dimensional fixed sets can exhibit strobing if local color transforms and delay are set appropriately. This is due to flow within the fixed set. That is, instead of sourcing color from outside the fixed set, points in the fixed set map to eachother. This effectively decouples the fixed set from the outside world, encouraging positive feedback loops that often aren't pleasing. However, increasing the delay fends off the strobing effect and can produce pleasant, organic-looking dynamic patterns.

It is possible to identify fixed sets by the number of iterations a given pixel has survived. The number of iterations grows unbounded within the fixed set due to the uncoupling mentioned above. Therefore, filtering by "iteration depth" could be used in the future to block strobing or even inject color into fixed sets, allowing visualization of trajectories within the fixed set.

[fs-1d-fractal]:   ./img/fixed-set-1d-fractal.png
[fs-2d-fractal]:   ./img/fixed-set-2d-fractal.png
[fs-2d-saturated]: ./img/fixed-set-2d-saturated.png
[fs-curved-line]:  ./img/fixed-set-curved-line.png
[fs-line]:         ./img/fixed-set-line.png
[fs-mushroom]:  ./img/fixed-set-mushroom.png
[fs-point]:     ./img/fixed-set-point.png
