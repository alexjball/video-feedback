toPPM = function(width, height, format, buffer, byteOffset, length) {
    
    // Create a byte array representing a ppm image.
    // format refers to the input format of pixels
    // in bufferView and is either toPPM.RGB or toPPM.RGBA.
    // See http://netpbm.sourceforge.net/doc/ppm.html
    // for the PPM spec.
    
    var arr = new Uint8Array(buffer, byteOffset, length);
        
    // This declares the binary PPM format, the size of the image, and that
    // R, G, B values are 1 byte each.
    var header = 'P6 ' + width + ' ' + height + ' 255\n';    
    
    var stride;
    if (format === toPPM.RGBA) {
        stride = 4;
    } else {
        stride = 3;
    }
    
    // The file size is just the header plus 3 bytes times the number of pixels.
    var size = header.length + arr.length / stride * 3;
    
    var ppm = new Uint8Array(size), i = 0;
    
    
    while (i < header.length) {
        
        ppm[i] = header.charCodeAt(i);
        
        i++;
        
    }
    
    // var j = 0, jump = stride - 3;
    // while (j < arr.length) {
        
    //     ppm[i++] = arr[j++];
    //     ppm[i++] = arr[j++];
    //     ppm[i++] = arr[j++];
        
    //     j += jump;
        
    // }
    
    // Copy the buffer into the ppm file.
    // PPM files have the highest row first, but the buffer has the lowest
    // first. Therefore we write rows in the reverse order.
    var j, rowEnd, rowSize = width * stride, jump = stride - 3;
    for (var row = height - 1; row >= 0; row--) {
        
        j = row * rowSize;
        rowEnd = j + rowSize;
        
        while (j < rowEnd) {
            
            ppm[i++] = arr[j++];
            ppm[i++] = arr[j++];
            ppm[i++] = arr[j++];
            
            j += jump;
            
        }
        
    }
        
    // JSZip can source directly from Uint8Array.
    return ppm.buffer;
    
}

toPPM.RGB  = 0;
toPPM.RGBA = 1;
