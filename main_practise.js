function getWebGLContext(canvas) {
  let gl;

  // Modern browsers
  gl = canvas.getContext('webgl');

  // IE & Edge
  if (!gl)
    // @ts-ignore
    gl = canvas.getContext('experimental-webgl');

  if (gl !== null && gl !== undefined)
    return gl
  else
    throw new Error("Your browser does not support WebGL")
}

function quickCompileProgram(
  gl,
  vertexShaderSource,
  fragmentShaderSource,
) {

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  const program = gl.createProgram();
  if (!program)
    throw new Error("Unable to create GL program");
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(`Error linking GL program: ${gl.getProgramInfoLog(program)}`);
  gl.validateProgram(program);
  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS))
    throw new Error(`Error validating program: ${gl.getProgramInfoLog(program)}`);

  return program;
}


function compileShader(
  gl,
  shaderType,
  shaderSource
) {
  const shader = gl.createShader(shaderType);
  if (!shader)
    throw new Error("Unable to create vertex shader");
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    throw new Error(`Error compiling ${shaderType === gl.VERTEX_SHADER ? "vertex" : "fragment"
      } shader: ${gl.getShaderInfoLog(shader)}`)

  return shader
}


// ROBBIE: Vertex (geometry) shader here
const SoundWavesVShader = `
precision mediump float;
attribute vec2 position;
void main() {
  gl_Position = vec4(
    position,
    0.5, 
    1.0
  );
}
`

// ROBBIE: Fragment (pixel) shader here
const SoundWavesFShader = `
precision mediump float;
uniform vec2 screenSize;
uniform float phase;
vec4 white = vec4(1.0, 0.0, 0.0, 1.0);
vec4 transparent = vec4(1.0, 1.0,1.0 , 0.0);
void main() {
  float x = gl_FragCoord.x / screenSize.x;
  float y = 2.0 * gl_FragCoord.y / screenSize.y - 1.0;
  float A = sin(x + phase);
  if(abs(y) < abs(A))
    gl_FragColor = sin(y*200.0) * white;
}
`

const fillScreenBuffer = new Float32Array([
  -1, -1,
  1, -1,
  1, 1,
  -1, 1
]);

/**
  Sets up rendering of sine waves on a canvas using WebGL.
  Be sure to handle exceptions when calling this function.
 */
function startSoundWaves(canvas) {

  const gl = getWebGLContext(canvas)

  const program = quickCompileProgram(
    gl, SoundWavesVShader, SoundWavesFShader
  );
  gl.useProgram(program);

  const vertexData = fillScreenBuffer;
  const elementsPerVertex = 2
  const numberOfVertices = 4;

  const bufferObject = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferObject);
  gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

  const positionAttribLocation = gl.getAttribLocation(program, 'position');
  gl.vertexAttribPointer(
    positionAttribLocation, // location
    2, // number of elements
    gl.FLOAT, // element type
    false, // Normalised
    elementsPerVertex * Float32Array.BYTES_PER_ELEMENT, // stride
    0,
  )
  gl.enableVertexAttribArray(positionAttribLocation);

  // Expose uniforms
  const phaseUniform = gl.getUniformLocation(program, 'phase');
  let phase = 0

  const screenSizeUniform = gl.getUniformLocation(program, 'screenSize');
  gl.uniform2f(screenSizeUniform, canvas.width, canvas.height);

  const loop = () => {
    phase += 0.01
    gl.uniform1f(phaseUniform, phase)

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, numberOfVertices)

    window.requestAnimationFrame(loop)
  }

  loop();
}



startSoundWaves(document.getElementById("c"))
