// https://webglfundamentals.org/
// https://www.tutorialspoint.com/webgl/webgl_drawing_a_triangle.htm


import {
    initShaderProgram,
    degToRad,
    perspective,
    lookAt,
    inverse,
    multiply,
    xRotation,
    yRotate,
    zRotate,
    transpose,
    normalize,
    transformVector,
} from '../utils/utils';


export let renderParams = {
    isAutoRotation: true,
    numColors: 32,
    rotation: [0.0, 0.0, 0.0],
    translate: [0.0, 0.0, 0.0],
    scale: 1.0,
    mesh: null,
    funIndex: 0,
    isMesh: true,
    isSurface: true,
    isAxes: true,
    isLegend: true,
    isTransformation: false,
    transformParam: {
        index: [0, 1, 2],
        ratio: 0.0,
    }
}

let renderData = {
    numTri: 0,
    numSeg: 0,
    minU: [0.0, 0.0],
    maxU: [0.0, 0.0],
    colorTable: [],
    radius: 0.0,
    xc: [0.0, 0.0, 0.0],
    maxTransformRatio: 0.0,
    id: null,
    legend: {
        color: [7],
        value: [7],
    },
}


// Vertex shader
let vertexShaderSource = `
  //precision highp float;
  attribute vec4 a_position;
  attribute vec3 a_normal;
  attribute vec4 a_color;

  uniform mat4 u_worldViewProjection;
  uniform mat4 u_worldInverseTranspose;
  uniform vec4 u_translation_center;
  uniform vec4 u_translation;
  uniform vec4 u_scale;
  

  varying vec3 v_normal;
  varying vec4 v_color;

  void main() {
    // Multiply the position by the matrix.
    gl_Position = u_worldViewProjection * (u_scale * a_position - u_scale * u_translation_center) - u_translation;
    //gl_Position = u_worldViewProjection * (a_position - vec4(0.5, 0.5, 0.5, 0.0));

    // orient the normals and pass to the fragment shader
    v_normal = mat3(u_worldInverseTranspose) * a_normal;
    v_color = a_color;
  }
`;

// Fragment shader
let fragmentShaderSource = `
  precision mediump float;
  //precision highp float;

  // Passed in from the vertex shader.
  varying vec3 v_normal;
  varying vec4 v_color;

  uniform vec3 u_reverseLightDirection;
  uniform vec4 u_color;
  uniform int u_is_mesh;

  void main() {
    // because v_normal is a varying it's interpolated
    // so it will not be a unit vector. Normalizing it
    // will make it a unit vector again
    vec3 normal = normalize(v_normal);

    float light = dot(normal, u_reverseLightDirection);

    //gl_FragColor = u_color;
    
    if (u_is_mesh == 0)
        gl_FragColor = v_color;
    else
        gl_FragColor = u_color;
    
    //gl_FragColor = v_color;

    // Lets multiply just the color portion (not the alpha)
    // by the light
    gl_FragColor.rgb *= abs(light);
  }
`;

export function renderImage() {
    // Get a WebGL context
    /** @type {HTMLCanvasElement} */
    let canvas = document.querySelector("canvas");
    let gl = canvas.getContext("webgl");
    if (!gl) {
        alert("Failed to get the rendering context for WebGL");
        //console.log("Failed to get the rendering context for WebGL");
        return;
    }

    // Get a canvas text context
    let textCanvas = document.querySelector("#text");
    let ctx = textCanvas.getContext("2d");

    // setup GLSL program
    const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            positionLocation: gl.getAttribLocation(shaderProgram, "a_position"),
            normalLocation: gl.getAttribLocation(shaderProgram, "a_normal"),
            colorLocation: gl.getAttribLocation(shaderProgram, "a_color"),
        },
        uniformLocations: {
            worldViewProjectionLocation: gl.getUniformLocation(shaderProgram, "u_worldViewProjection"),
            worldInverseTransposeLocation: gl.getUniformLocation(shaderProgram, "u_worldInverseTranspose"),
            worldTranslationCenter: gl.getUniformLocation(shaderProgram, "u_translation_center"),
            worldTranslation: gl.getUniformLocation(shaderProgram, "u_translation"),
            worldScale: gl.getUniformLocation(shaderProgram, "u_scale"),
            colorLocation: gl.getUniformLocation(shaderProgram, "u_color"),
            reverseLightDirectionLocation: gl.getUniformLocation(shaderProgram, "u_reverseLightDirection"),
            isMeshLocation: gl.getUniformLocation(shaderProgram, "u_is_mesh"),
        },
    };

    cancelAnimationFrame(renderData.id);
    renderData.minU = [0.0, 0.0];
    renderData.maxU = [0.0, 0.0];

    if (renderParams.isTransformation) {
        renderData.maxTransformRatio = 0.0;
        for (let k = 0; k < 3; k++) {
            if (Math.abs(renderParams.mesh.func[renderParams.transformParam.index[k]].maxU) > renderData.maxTransformRatio) {
                renderData.maxTransformRatio = Math.abs(renderParams.mesh.func[renderParams.transformParam.index[k]].maxU);
            }
            if (Math.abs(renderParams.mesh.func[renderParams.transformParam.index[k]].minU) > renderData.maxTransformRatio) {
                renderData.maxTransformRatio = Math.abs(renderParams.mesh.func[renderParams.transformParam.index[k]].minU);
            }
        }
    }

    getRegion();
    setColorTable();
    // Create a buffers to put positions in
    let buffers = createBuffers(gl, renderData.radius);

    if (renderParams.mesh.func.length) {
        createLegend();
    }


    //let then = 0;

    // Draw the scene repeatedly
    function render(/* now */) {
        //now *= 0.001; // convert to seconds
        let deltaTime = 0.017; // now - then;
        //then = now;

        renderScene(gl, ctx,  programInfo, buffers);

        if (renderParams.isAutoRotation === true) {
            renderParams.rotation[0] += deltaTime;
            renderParams.rotation[1] += 0.7 * deltaTime;
            renderParams.rotation[2] += 0.3 * deltaTime;
        }

        renderData.id = requestAnimationFrame(render);
    }
    renderData.id = requestAnimationFrame(render);
}


function createLegend() {
    if (renderParams.mesh.func.length !== 0) {
        let h = (renderData.maxU[0] - renderData.minU[0]) / 7.0;
        let start = getColorIndex(renderData.maxU[0]);
        let stop = getColorIndex(renderData.minU[0]);
        let step = (start - stop) / 6.0;

        for (let i = 0; i < 7; i++) {
            let index = i !== 6 ? Math.round(start - i * step) : stop;
            renderData.legend.color[i] = "rgb(" + 255 * renderData.colorTable[index][0] + ", " +
                255 * renderData.colorTable[index][1] + ", " + 255 * renderData.colorTable[index][2] + ")";
            renderData.legend.value[i] = ((x, f) => {
                let value = x.toExponential(f);
                return value >= 0 ? "+" + value : value;
            })(i === 6 ? renderData.minU[0] : renderData.maxU[0] - i * h, 5);
        }
    }
}

function showLegend(ctx) {
    let top = 20;
    let left = 10;
    for (let i = 0; i < 7; i++) {
        ctx.font = "14px monospace";
        ctx.fillStyle = renderData.legend.color[i];
        ctx.fillText("█", left,  top + i * 20);
        ctx.fillStyle = "black";
        ctx.fillText(String(renderData.legend.value[i]), left + ctx.measureText("12").width,  top + i * 20);

    }
}

function createBuffers(gl, radius) {
    let geometry = getGeometry();
    // Create a buffer to put positions in
    let positionBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Put geometry data into buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.surface_positions), gl.STATIC_DRAW);

    // Create a buffer to put mesh positions in
    let meshPositionBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, meshPositionBuffer);
    // Put geometry data into buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.mesh_positions), gl.STATIC_DRAW);


    // Create a buffer to put normals in
    let normalBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = normalBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    // Put normals data into buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.normals), gl.STATIC_DRAW);

    let surfaceColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, surfaceColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.colors), gl.STATIC_DRAW);

    let axesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, axesBuffer);
    // Put geometry data into buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.0, 0.0, 0.0, 0.05 * radius, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
        0.05 * radius, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.05 * radius]), gl.STATIC_DRAW);

    return {
        surface_position: positionBuffer,
        mesh_position: meshPositionBuffer,
        axes_position: axesBuffer,
        surface_normal: normalBuffer,
        surface_color: surfaceColorBuffer,
    };
}


function getColorIndex(u) {
    let ret = 0;
    if (renderData.minU[1] !== renderData.maxU[1]) {
        ret = Math.floor((u - renderData.minU[1]) / ((renderData.maxU[1] - renderData.minU[1]) /
            renderParams.numColors)) - 1;
    }
    return ret < 0 ? 0 : ret >= renderData.colorTable.length ? renderData.colorTable.length - 1 : ret;
}

function getGeometry() {
    let index = [[0, 1, 2], [2, 3, 0]];
    let elm = renderParams.mesh.feType.indexOf("fe2d") === -1 ? renderParams.mesh.be : renderParams.mesh.fe;
    let len = renderParams.mesh.feType === "fe2d4" || renderParams.mesh.feType === "fe3d4s" ||
                       renderParams.mesh.feType === "fe3d8" ? 2 : 1;
    let positions = [];
    let normals = [];
    let colors = [];
    let mesh_positions = [];
    for (let i = 0; i < elm.length; i++) {
        for (let j = 0; j < len; j++) {
            let tri = []
            for (let k = 0; k < 3; k++) {
                tri.push([
                    tX(elm[i][index[j][k]], 0),
                    tX(elm[i][index[j][k]], 1),
                    renderParams.mesh.feType.indexOf("fe2d") === -1 ? tX(elm[i][index[j][k]], 2) : 0.0,
                    renderParams.mesh.func.length !== 0 ?
                        renderParams.mesh.func[renderParams.funIndex].results[elm[i][index[j][k]]] : 0.0
                ]);
            }
            setTriangle3d(tri, positions, normals, colors);
        }

        mesh_positions.push(tX(elm[i][0], 0), tX(elm[i][0], 1),
            renderParams.mesh.feType.indexOf("fe2d") === -1 ? tX(elm[i][0], 2) : 0.0);
        for (let j = 1; j < (len === 1 ? 3 : 4); j++) {
            mesh_positions.push(tX(elm[i][j], 0), tX(elm[i][j], 1),
                renderParams.mesh.feType.indexOf("fe2d") === -1 ? tX(elm[i][j], 2) : 0.0,
                tX(elm[i][j],0), tX(elm[i][j], 1),
                renderParams.mesh.feType.indexOf("fe2d") === -1 ? tX(elm[i][j], 2) : 0.0);
        }
        mesh_positions.push(tX(elm[i][0], 0), tX(elm[i][0], 1),
            renderParams.mesh.feType.indexOf("fe2d") === -1 ? tX(elm[i][0], 2) : 0.0);
    }
    renderData.numTri = positions.length / 3;
    renderData.numSeg = mesh_positions.length / 3;
    return {surface_positions: positions, mesh_positions: mesh_positions, normals: normals, colors: colors}
}

function setColorTable() {
    let step = renderParams.numColors / 6;
    let h = 1.0 / step;
    let green = 0.0;
    let blue = 1.0;
    //let red = 0.24;
    let red = 1.0;

    if (renderParams.mesh.func.length) {
        renderData.minU[0] = renderParams.mesh.func[renderParams.funIndex].minU;
        renderData.maxU[0] = renderParams.mesh.func[renderParams.funIndex].maxU;
        renderData.minU[1] = Math.abs(renderData.minU[0]) > Math.abs(renderData.maxU[0]) ?
            -Math.abs(renderData.minU[0]) : -Math.abs(renderData.maxU[0]);
        renderData.maxU[1] = Math.abs(renderData.minU[1]);
    }

    renderData.colorTable = [];
    for (let i = 0; i < renderParams.numColors; i++) {
        if (i < step) {
            // purple - dark blue
            renderData.colorTable.push([red, 0.0, 1.0]);
            red = red < 0.0 ? 0.0 : red - h;
        } else if (step <= i && i < 2 * step) {
            // dark blue-blue
            renderData.colorTable.push([0.0, green, 1.0]);
            green = green > 1.0 ? 1.0 : green + h;
        } else if (2 * step <= i && i < 3 * step) {
            // blue-green
            renderData.colorTable.push([0.0, 1.0, blue]);
            blue = blue < 0.0 ? 0.0 : blue - h;
        } else if (3 * step <= i && i < 4 * step) {
            // green-yellow
            renderData.colorTable.push([red, 1.0, 0.0]);
            red = red > 1.0 ? 1.0 : red + h;
        } else if (i > 4 * step) {
            // yellow-orange-red
            renderData.colorTable.push([1.0, green, 0.0])
            green = green < 0.0 ? 0.0 : green - 0.5 * h;
        }
    }
}


function setTriangle3d(tri, positions, normals, colors) {
    let normal = ((x) => {
        return [
            ((x[4] - x[1]) * (x[8] - x[2]) - (x[7] - x[1]) * (x[5] - x[2])),
            ((x[6] - x[0]) * (x[5] - x[2]) - (x[3] - x[0]) * (x[8] - x[2])),
            ((x[3] - x[0]) * (x[7] - x[1]) - (x[6] - x[0]) * (x[4] - x[1]))
        ];
    })([tri[0][0], tri[0][1], tri[0][2], tri[1][0], tri[1][1], tri[1][2], tri[2][0], tri[2][1], tri[2][2]]);
    let colorIndex = [getColorIndex(tri[0][3]), getColorIndex(tri[1][3]), getColorIndex(tri[2][3])];
    let index = sort(tri);
    if ((colorIndex[0] === colorIndex[1]) && (colorIndex[1] === colorIndex[2])) {
        for (let i = 0; i < 3; i++) {
            positions.push(tri[index[i]][0], tri[index[i]][1], tri[index[i]][2]);
            normals.push(normal[0], normal[1], normal[2]);
            colors.push(renderData.colorTable[colorIndex[0]][0], renderData.colorTable[colorIndex[0]][1],
                renderData.colorTable[colorIndex[0]][2]);
        }
    } else {
        let step = colorIndex[index[2]] - colorIndex[index[0]] + 1;
        let p02 = [];
        let x = [tri[index[0]][0], tri[index[0]][1], tri[index[0]][2], colorIndex[index[0]]];
        let h = [(tri[index[2]][0] - tri[index[0]][0]) / step, (tri[index[2]][1] - tri[index[0]][1]) / step,
            (tri[index[2]][2] - tri[index[0]][2]) / step, (colorIndex[index[2]] - colorIndex[index[0]]) / step];
        for (let i = 0; i < step; i++) {
            p02.push([x[0] + i * h[0], x[1] + i * h[1], x[2] + i * h[2], colorIndex[index[0]] + i * h[3]]);
        }
        p02.push([tri[index[2]][0], tri[index[2]][1], tri[index[2]][2], colorIndex[index[2]]]);

        step = colorIndex[index[1]] - colorIndex[index[0]] + 1;
        let p012 = [];
        x = [tri[index[0]][0], tri[index[0]][1], tri[index[0]][2], colorIndex[index[0]]];
        h = [(tri[index[1]][0] - tri[index[0]][0]) / step, (tri[index[1]][1] - tri[index[0]][1]) / step,
            (tri[index[1]][2] - tri[index[0]][2]) / step, (colorIndex[index[1]] - colorIndex[index[0]]) / step];
        for (let i = 1; i < step; i++) {
            p012.push([x[0] + i * h[0], x[1] + i * h[1], x[2] + i * h[2], colorIndex[index[0]] + i * h[3]]);
        }
        p012.push([tri[index[1]][0], tri[index[1]][1], tri[index[1]][2], colorIndex[index[1]]]);

        step = colorIndex[index[2]] - colorIndex[index[1]] + 1;
        x = [tri[index[1]][0], tri[index[1]][1], tri[index[1]][2], colorIndex[index[1]]];
        h = [(tri[index[2]][0] - tri[index[1]][0]) / step, (tri[index[2]][1] - tri[index[1]][1]) / step,
            (tri[index[2]][2] - tri[index[1]][2]) / step, (colorIndex[index[2]] - colorIndex[index[1]]) / step];
        for (let i = 1; i < step; i++) {
            p012.push([x[0] + i * h[0], x[1] + i * h[1], x[2] + i * h[2], colorIndex[index[1]] + i * h[3]]);
        }
        for (let i = 0; i < p02.length - 1; i++) {
            if (i < p012.length) {
                let clr = Math.round(Math.min(p02[i][3], p02[i + 1][3], p012[i][3]));
                colors.push(renderData.colorTable[clr][0], renderData.colorTable[clr][1], renderData.colorTable[clr][2],
                    renderData.colorTable[clr][0], renderData.colorTable[clr][1], renderData.colorTable[clr][2],
                    renderData.colorTable[clr][0], renderData.colorTable[clr][1], renderData.colorTable[clr][2]);
                positions.push(p02[i][0], p02[i][1], p02[i][2], p012[i][0], p012[i][1], p012[i][2], p02[i + 1][0],
                    p02[i + 1][1], p02[i + 1][2]);
                normals.push(normal[0], normal[1], normal[2], normal[0], normal[1], normal[2], normal[0], normal[1],
                    normal[2]);
                if (i + 1 < p012.length) {
                    clr = Math.round(Math.min(p02[i + 1][3], p012[i][3], p012[i + 1][3]));
                    colors.push(renderData.colorTable[clr][0], renderData.colorTable[clr][1],
                        renderData.colorTable[clr][2], renderData.colorTable[clr][0],
                        renderData.colorTable[clr][1], renderData.colorTable[clr][2], renderData.colorTable[clr][0],
                        renderData.colorTable[clr][1], renderData.colorTable[clr][2]);
                    positions.push(p02[i + 1][0], p02[i + 1][1], p02[i + 1][2], p012[i][0], p012[i][1], p012[i][2],
                        p012[i + 1][0], p012[i + 1][1], p012[i + 1][2]);
                    normals.push(normal[0], normal[1], normal[2], normal[0], normal[1], normal[2], normal[0], normal[1],
                        normal[2]);
                }
            }
        }
    }
}

function sort(tri) {
    if (tri[0][3] === tri[1][3] && tri[1][3] === tri[2][3]) {
        return [0, 1, 2];
    }
    let min_u = tri[0][3];
    let max_u = tri[0][3];
    let min_index = 0;
    let max_index = 0;
    for (let i = 1; i < 3; i++) {
        if (tri[i][3] < min_u) {
            min_u = tri[i][3];
            min_index = i;
        }
        if (tri[i][3] > max_u) {
            max_u = tri[i][3];
            max_index = i;
        }
    }
    return [min_index, 3 - min_index - max_index, max_index];
}

function resizeCanvasToDisplaySize(canvas, multiplier) {
    multiplier = multiplier || 1;
    const width = canvas.clientWidth * multiplier | 0;
    const height = canvas.clientHeight * multiplier | 0;
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
    }
    return false;
}

function tX(i, j) {
    if (renderParams.isTransformation) {
        return renderParams.mesh.x[i][j] + renderParams.transformParam.ratio * renderData.radius *
            (renderParams.mesh.func[renderParams.transformParam.index[j]].results[i] / renderData.maxTransformRatio);
    }
    return renderParams.mesh.x[i][j];
}


function getRegion() {
    let minX = [tX(0, 0), tX(0, 1), renderParams.mesh.feType === "fe2d3" ||
        renderParams.mesh.feType === "fe2d4" ? 0.0 : tX(0, 2)];
    let maxX = [tX(0, 0), tX(0, 1), renderParams.mesh.feType === "fe2d3" ||
        renderParams.mesh.feType === "fe2d4" ? 0.0 : tX(0, 2)];
    for (let i = 1; i < renderParams.mesh.x.length; i++) {
        for (let j = 0; j < renderParams.mesh.x[i].length; j++) {
            if (tX(i, j) > maxX[j]) {
                maxX[j] = tX(i, j);
            }
            if (tX(i, j) < minX[j]) {
                minX[j] = tX(i, j);
            }
        }
    }
    renderData.radius = Math.sqrt(Math.pow(maxX[0] - minX[0], 2) + Math.pow(maxX[1] - minX[1], 2) +
        Math.pow(maxX[2] - minX[2], 2));
    renderData.xc = [(maxX[0] + minX[0]) * 0.5, (maxX[1] + minX[1]) * 0.5, (maxX[2] + minX[2]) * 0.5];
}

// Draw the scene
function renderScene(gl, ctx, programInfo, buffers) {
    resizeCanvasToDisplaySize(gl.canvas);
    resizeCanvasToDisplaySize(ctx.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Clear the 2D canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);


    // gl.enable(gl.POLYGON_OFFSET_FILL);
    // gl.polygonOffset(0.0, -1.0);

    // Enable the depth buffer
    gl.enable(gl.DEPTH_TEST);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(programInfo.program);

    // Turn on the position attribute
    gl.enableVertexAttribArray(programInfo.attribLocations.positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.surface_position);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    let size = 3;          // 3 components per iteration
    let type = gl.FLOAT;   // the data is 32bit floats
    let isNormalize = false; // don't normalize the data
    let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    let offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(programInfo.attribLocations.positionLocation, size, type, isNormalize, stride, offset);

    // Turn on the normal attribute
    gl.enableVertexAttribArray(programInfo.attribLocations.normalLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.surface_normal);
    gl.vertexAttribPointer(programInfo.attribLocations.normalLocation, size, type, isNormalize, stride, offset);

    gl.enableVertexAttribArray(programInfo.attribLocations.colorLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.surface_color);
    gl.vertexAttribPointer(programInfo.attribLocations.colorLocation, size, type, isNormalize, stride, offset);

    // Compute the projection matrix
    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    let zNear = 0.1 * renderData.radius;
    let zFar = 100 * renderData.radius;
    let projectionMatrix = perspective(degToRad(60), aspect, zNear, zFar);


    // Compute the camera's matrix
    let camera = [renderData.radius, renderData.radius, renderData.radius];
    let target = [0, 0, 0];
    let up = [0, 0, renderData.radius];
    let cameraMatrix = lookAt(camera, target, up);


    // Make a view matrix from the camera matrix.
    let viewMatrix = inverse(cameraMatrix);

    // Compute a view projection matrix
    let viewProjectionMatrix = multiply(projectionMatrix, viewMatrix);

    // Draw F at the origin
    let worldMatrix = xRotation(renderParams.rotation[0]);

    yRotate(worldMatrix, renderParams.rotation[1], worldMatrix);
    zRotate(worldMatrix, renderParams.rotation[2], worldMatrix);

    // Multiply the matrices.
    let worldViewProjectionMatrix = multiply(viewProjectionMatrix, worldMatrix);
    let worldInverseMatrix = inverse(worldMatrix);
    let worldInverseTransposeMatrix = transpose(worldInverseMatrix);


    // Set the matrices
    gl.uniformMatrix4fv(programInfo.uniformLocations.worldViewProjectionLocation, false,
        worldViewProjectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.worldInverseTransposeLocation, false,
        worldInverseTransposeMatrix);
    gl.uniform4f(programInfo.uniformLocations.worldTranslationCenter, renderData.xc[0], renderData.xc[1],
        renderData.xc[2], 0.0);
    gl.uniform4f(programInfo.uniformLocations.worldTranslation, -renderParams.translate[0] * renderData.radius,
        -renderParams.translate[1] * renderData.radius,
        -renderParams.translate[2] * renderData.radius, 0.0);
    gl.uniform4f(programInfo.uniformLocations.worldScale, renderParams.scale, renderParams.scale, renderParams.scale, 1.0);

    // Set the color to use
    //gl.uniform4fv(programInfo.uniformLocations.colorLocation, [0.2, 1, 0.2, 1]); // green

    // set the light direction.
    gl.uniform3fv(programInfo.uniformLocations.reverseLightDirectionLocation, normalize([0.5, 0.7, 1], null));

    // set the is mesh sign
    gl.uniform1i(programInfo.uniformLocations.isMeshLocation, 0);

    // Draw the geometry.
    if (renderParams.isSurface) {
        gl.drawArrays(gl.TRIANGLES, 0, renderData.numTri);
    }

    gl.uniform1i(programInfo.uniformLocations.isMeshLocation, 1);
    gl.uniform4fv(programInfo.uniformLocations.colorLocation, [0.0, 0.0, 0.0, 1.0]); // black

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.mesh_position);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    gl.vertexAttribPointer(programInfo.attribLocations.positionLocation, size, type, isNormalize, stride, offset);
    // Draw the mesh
    if (renderParams.isMesh) {
        gl.drawArrays(gl.LINES, offset, renderData.numSeg);
    }


    // Draw the coordinate axes
    if (renderParams.isAxes) {
        gl.uniform4f(programInfo.uniformLocations.worldTranslationCenter, 0.0, 0.0, 0.0, 0.0);
        gl.uniform4f(programInfo.uniformLocations.worldTranslation, 1.5 * renderData.radius, renderData.radius,
            0.0, 0.0);
        gl.uniform4f(programInfo.uniformLocations.worldScale, 1.0, 1.0, 1.0, 1.0);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.axes_position);
        gl.vertexAttribPointer(programInfo.attribLocations.positionLocation, size, type, isNormalize, stride, offset);
        // Turn on the normal attribute
        gl.enableVertexAttribArray(programInfo.attribLocations.normalLocation);
        gl.disable(gl.DEPTH_TEST);
        gl.drawArrays(gl.LINES, 0, 6);
        gl.enable(gl.DEPTH_TEST);
    }
    drawAxesLabel(gl, ctx, worldViewProjectionMatrix, renderData.radius);

    if (renderParams.isLegend && renderParams.mesh.func.length) {
        showLegend(ctx);
    }
}

function drawAxesLabel(gl, ctx, matrix, radius) {
    let label = ["X", "Y", "Z"];
    let point = [[0.06 * radius, 0, 0, 1], [0.0, 0.06 * radius, 0, 1], [0.0, 0.0, 0.06 * radius, 1]];
    for (let i = 0; i < 3; i++) {
        let clipSpace = transformVector(matrix, point[i]);
        clipSpace[0] = (clipSpace[0] - 1.5 * radius) / clipSpace[3];
        clipSpace[1] = (clipSpace[1] - radius) / clipSpace[3];
        ctx.font = "14px serif";
        ctx.fillText(renderParams.isAxes ? label[i] : "", (clipSpace[0] *  0.5 + 0.5) * gl.canvas.width,
            (clipSpace[1] * -0.5 + 0.5) * gl.canvas.height);
    }
}

