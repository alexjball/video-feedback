/* 
 * meshMaker
 *
 * Returns an array of two meshes (2D arrays of triangle vertices), given a 
 * symmetry and options. The z-component of any vertex is always 0.
 * 
 * Arguments:
 * - symmetry (string)
 *     - The symmetry transformation
 * - options (2-array)
 *     - Mirror/inversion symmetry: [point1, point2] that define the symmetry 
 *       axis
 *     - Kaleidoscope symmetry: [# of "fans", mirrorOn (boolean)]
 * - range (number [0..1])
 *     - Mirror/inversion symmetry: the side length of a square in which the
 *       transformation will occur.
 *     - Kaleidoscope symmetry: the diameter of a circle in which the
 *       transformation will occur.
 *     - If no range is given, its value will default to 1.
 *
 * Returns:
 * - mesh (array)
 *     - Array of n vertices, where each vertex is specified by a 3-array in
 *       texture space (each component in range [0..1])
 * 
 * TODO:
 * - Make 'range' itself a mesh
 * - Basic type checking
 */

meshMaker = function(symmetry, options, range) {
    if (!range) {
        var range = 1;
    }

    var meshFrom = [];
    var meshTo = [];

    switch(symmetry) {
        case "mirror":
            // Restrict angle to [0, pi).
            var angle = options[2] % Math.PI;

            var rot180 = function(point) {
                // 180-degree rotation is equivalent to both x- and y-inversion.
                return (-1 * point);
            }







            break;





        case "invert":
            break;







        case "kaleidoscope":
            var nFans = options[0];
            var mirrorOn = options[1];
            var fanAngle = 2 * Math.PI / nFans;
            var radius = range / 2;
            var zero = [0, 0, 0];

            var getPoint = function(radius, fanAngle, step) {
                var x = radius * Math.cos(step * fanAngle);
                var y = radius * Math.sin(step * fanAngle);
                return [x, y, 0];
            }

            // Check the number of fans. #try using a fractional number of fans.
            if (nFans < 2) {
                throw "you fucked up";
            }

            // Get base fan coordinates.
            var baseFan = [zero,
                           getPoint(radius, fanAngle, 0),
                           getPoint(radius, fanAngle, 1)];

            // Push mesh fan coordinates.
            for (var i = 0; i < nFans; i++) {
                meshFrom = meshFrom.concat(baseFan);
                meshTo = meshTo.concat([zero,
                                        getPoint(radius, fanAngle, i)
                                        getPoint(radius, fanAngle, i + 1)]);
            }

            if mirrorOn {
                /* 
                 * Replace 'C' with 'B', '0', 'A', 'B' throughout meshFrom.
                 * Iterate backward to preserve indexing.
                 */
                for (var i = nFans - 1; i >= 0; i--) {
                    var midPoint = getPoint(radius, fanAngle, 0.5);
                    meshFrom.splice((i * 3) + 2, 1,
                                    midPoint,
                                    zero,
                                    getPoint(radius, fanAngle, 0),
                                    midPoint);
                }

                // Replace 'C' with 'B', '0', 'C', 'B' throughout meshTo.
                for (var i = nFans - 1; i >= 0; i--) {
                    var midPoint = getPoint(radius, fanAngle, i + 0.5);
                    var endPoint = getPoint(radius, fanAngle, i + 1);
                    meshTo.splice((i * 3) + 2, 1,
                                  midPoint,
                                  zero,
                                  endPoint,
                                  midPoint);
                }
            }

            break;

        // If the symmetry did not match any of the above, you fucked up.
        throw "you fucked up";
    }

    return [meshFrom, meshTo];
}



