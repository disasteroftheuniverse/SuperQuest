/*jshint esversion: 6*/

module.exports = {
	grid: AFRAME.registerShader('grid', {
		schema: {
			FGColor: {
				type: 'color',
				is: 'uniform',
				default: '#FFF'
			},
			BGColor: {
				type: 'color',
				is: 'uniform',
				default: '#000'
			},
			Thickness: {
				type: 'number',
				is: 'uniform',
				default: 0.025
			},
			GridSize: {
				type: 'number',
				is: 'uniform',
				default: 1
			},
			time: {
				type: 'time',
				is: 'uniform'
			},
			cameraPosition: {
				type: 'vec3',
				is: 'uniform',
				default: {
					x: 0,
					y: 0,
					z: 0
				}
			},
		},
		raw: true,
		fragmentShader: '/**\n* Example Fragment Shader\n* Sets the color and alpha of the pixel by setting gl_FragColor\n*/\n\n// Set the precision for data types used in this shader\nprecision highp float;\nprecision highp int;\n\n// Default THREE.js uniforms available to both fragment and vertex shader\nuniform mat4 modelMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\nuniform mat4 viewMatrix;\nuniform mat3 normalMatrix;\n\n// Default uniforms provided by ShaderFrog.\nuniform vec3 cameraPosition;\nuniform float time;\n\n// A uniform unique to this shader. You can modify it to the using the form\n// below the shader preview. Any uniform you add is automatically given a form\n\n\n// Example varyings passed from the vertex shader\nvarying vec3 vPosition;\nvarying vec3 vNormal;\nvarying vec2 vUv;\nvarying vec2 vUv2;\n\nuniform float GridSize;\nuniform float Thickness;\nuniform vec3 BGColor;\nuniform vec3 FGColor;\n\nvoid main() {\n\n    // Calculate the real position of this pixel in 3d space, taking into account\n    // the rotation and scale of the model. It\'s a useful formula for some effects.\n    // This could also be done in the vertex shader\n    vec3 worldPosition = ( modelMatrix * vec4( vPosition, 1.0 )).xyz;\n\n    // Calculate the normal including the model rotation and scale\n    vec3 worldNormal = normalize( vec3( modelMatrix * vec4( vNormal, 0.0 ) ) );\n    \n    vec3 fr=fract(worldPosition/exp(GridSize-4.0));\n    float xf=abs(fr.x-0.5)*2.0;\n    float yf=abs(fr.y-0.5)*2.0;\n    float zf=abs(fr.z-0.5)*2.0;\n    float sqr=min(xf,yf);\n    sqr=min(sqr,zf);\n    vec3 col=BGColor;\n    if (sqr<=Thickness) {\n        col=FGColor;\n    }\n\n    // Fragment shaders set the gl_FragColor, which is a vector4 of\n    // ( red, green, blue, alpha ).\n    gl_FragColor = vec4( col, 1.0 );\n\n}',
		vertexShader: '/**\n* Example Vertex Shader\n* Sets the position of the vertex by setting gl_Position\n*/\n\n// Set the precision for data types used in this shader\nprecision highp float;\nprecision highp int;\n\n// Default THREE.js uniforms available to both fragment and vertex shader\nuniform mat4 modelMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\nuniform mat4 viewMatrix;\nuniform mat3 normalMatrix;\n\n// Default uniforms provided by ShaderFrog.\nuniform vec3 cameraPosition;\nuniform float time;\n\n// Default attributes provided by THREE.js. Attributes are only available in the\n// vertex shader. You can pass them to the fragment shader using varyings\nattribute vec3 position;\nattribute vec3 normal;\nattribute vec2 uv;\nattribute vec2 uv2;\n\n// Examples of variables passed from vertex to fragment shader\nvarying vec3 vPosition;\nvarying vec3 vNormal;\nvarying vec2 vUv;\nvarying vec2 vUv2;\n\nvoid main() {\n\n    // To pass variables to the fragment shader, you assign them here in the\n    // main function. Traditionally you name the varying with vAttributeName\n    vNormal = normal;\n    vUv = uv;\n    vUv2 = uv2;\n    vPosition = position;\n\n    // This sets the position of the vertex in 3d space. The correct math is\n    // provided below to take into account camera and object data.\n    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\n}',
	}),
	blend_images: AFRAME.registerShader('blend-images', {
		schema: {
			textureA: {
				type: 'map',
				is: 'uniform'
			},
			textureB: {
				type: 'map',
				is: 'uniform'
			},
			mask: {
				type: 'number',
				is: 'uniform',
				default: 0.5
			},
		},
		raw: true,
		fragmentShader: 'precision highp float;\nprecision highp int;\n\nuniform float mask;\nuniform sampler2D textureA;\nuniform sampler2D textureB;\n\nvarying vec2 vUv;\n \nvoid main() {\n    vec4 image1 = vec4( texture2D(textureA, vUv).rgb, 1.0 );\n    vec4 image2 = vec4( texture2D(textureB, vUv).rgb, 1.0 );\n    \n    vec4 color = ( image1 * mask) + (image2* (1.0 - mask));\n    \n    gl_FragColor = vec4( color);\n\n}',
		vertexShader: 'precision highp float;\nprecision highp int;\n\nuniform mat4 modelMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\nuniform mat4 viewMatrix;\nuniform mat3 normalMatrix;\n\nattribute vec3 position;\nattribute vec3 normal;\nattribute vec2 uv;\nattribute vec2 uv2;\n\nvarying vec2 vUv;\n\nvoid main() {\n  vUv = uv;\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n}',
	}),
	fresnel_glow: AFRAME.registerShader('fresnel-glow', {
		schema: {
			color: {
				type: 'color',
				is: 'uniform',
				default: '#FFF'
			},
			start: {
				type: 'number',
				is: 'uniform',
				default: 0
			},
			end: {
				type: 'number',
				is: 'uniform',
				default: 0
			},
			alpha: {
				type: 'number',
				is: 'uniform',
				default: 0
			},
		},
		raw: true,
		fragmentShader: '#extension GL_OES_standard_derivatives : enable\n\nprecision highp float;\n\nuniform vec3 color;\nuniform float start;\nuniform float end;\nuniform float alpha;\n\nvarying vec3 fPosition;\nvarying vec3 fNormal;\n\nvoid main()\n{\n  vec3 normal = normalize(fNormal);\n  vec3 eye = normalize(-fPosition.xyz);\n  float rim = smoothstep(start, end, 1.0 - dot(normal, eye));\n  gl_FragColor = vec4( clamp(rim, 0.0, 1.0) * alpha * color, 1.0 );\n}',
		vertexShader: 'precision highp float;\nattribute vec3 position;\nattribute vec3 normal;\nuniform mat3 normalMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\nvarying vec3 fNormal;\nvarying vec3 fPosition;\n\nvoid main()\n{\n  fNormal = normalize(normalMatrix * normal);\n  vec4 pos = modelViewMatrix * vec4(position, 1.0);\n  fPosition = pos.xyz;\n  gl_Position = projectionMatrix * pos;\n}',
	}),
	solid_fill: AFRAME.registerShader('solid-fill', {
		schema: {
			colorA: {
				type: 'color',
				is: 'uniform',
				default: '#FFF'
			},
			colorB: {
				type: 'color',
				is: 'uniform',
				default: '#000'
			},
			mask: {
				type: 'number',
				is: 'uniform',
				default: 0
			},
		},
		raw: true,
		fragmentShader: 'precision highp float;\nprecision highp int;\n\n#define PI 3.141592653589793238462643383279\n\nuniform vec3 colorA;\nuniform vec3 colorB;\nuniform float mask;\n\nvarying vec2 vUv;\n \nvoid main() {\n\n    float uvOffset = vUv.t;\n    float uvGradient = uvOffset ;\n    \n    vec3 color = colorB;\n    \n    if( uvGradient < mask ) {\n        color = colorA;\n    }\n    \n    gl_FragColor = vec4( color, 1.0 );\n\n}',
		vertexShader: 'precision highp float;\nprecision highp int;\n\nuniform mat4 modelMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\nuniform mat4 viewMatrix;\nuniform mat3 normalMatrix;\n\nattribute vec3 position;\nattribute vec3 normal;\nattribute vec2 uv;\nattribute vec2 uv2;\n\nvarying vec2 vUv;\n\nvoid main() {\n  vUv = uv;\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n}',
	}),
	spinner: AFRAME.registerShader('spinner', {
		schema: {
			time: {
				type: 'time',
				is: 'uniform'
			},
			cameraPosition: {
				type: 'vec3',
				is: 'uniform',
				default: {
					x: 0,
					y: 0,
					z: 0
				}
			},
			antialias: {
				type: 'number',
				is: 'uniform',
				default: 400
			},
			color: {
				type: 'color',
				is: 'uniform',
				default: '#FFF'
			},
			width: {
				type: 'number',
				is: 'uniform',
				default: 0.04
			},
			radius: {
				type: 'number',
				is: 'uniform',
				default: 0.3
			},
			fadePercent: {
				type: 'number',
				is: 'uniform',
				default: 0.75
			},
		},
		raw: true,
		fragmentShader: 'precision highp float;\n\n#define PI 3.14159265358979323\n\nuniform float time;\nuniform float fadePerecent;\nuniform vec3 color;\n\n// Mostly relative to UV coords\nuniform float width;\nuniform float radius;\nuniform float antialias;\n\nvarying vec2 vUv;\n\nvoid main(void) {\n\t// needs to be constant (can\'t be a uniform)\n\tconst int antialiasing = 4;\n\tfloat invResolution = 1.0 / antialias;\n\tvec2 pos = (vUv - 0.5) * antialias;\n\t\n\tvec4 sumColor = vec4(0.0);\n\tfloat total = 0.0;\n\n\tfloat offset = 1.0 / (float(antialiasing) + 2.0);\n\tfor (int j = -antialiasing; j <= antialiasing; j++) {\n\t\tfor (int i = -antialiasing; i <= antialiasing; i++) {\n\t\t\tvec2 adjustedPos = (pos + vec2(float(i) * offset, float(j) * offset)) / antialias;\n\t\t\tfloat dist = length(adjustedPos);\n\t\t\tif ( ( radius - width ) < dist && dist < ( radius + width ) ) {\n\t\t\t\tfloat ang = atan( adjustedPos.y, adjustedPos.x );\n\t\t\t\tsumColor += vec4(\n\t\t\t\t\t( color / fadePerecent ) * ( fadePerecent - mod( ang / PI + time, 2.0 ) / 2.0 ),\n\t\t\t\t\t0.0\n\t\t\t\t);\n\t\t\t}\n\t\t\ttotal += 1.0;\n\t\t}\n\t}\n\tgl_FragColor = vec4( ( sumColor / total ).xyz, 1.0 );\n\n}\n',
		vertexShader: '/**\n* Example Vertex Shader\n* Sets the position of the vertex by setting gl_Position\n*/\n\n// Set the precision for data types used in this shader\nprecision highp float;\nprecision highp int;\n\n// Default THREE.js uniforms available to both fragment and vertex shader\nuniform mat4 modelMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\nuniform mat4 viewMatrix;\nuniform mat3 normalMatrix;\n\n// Default uniforms provided by ShaderFrog.\nuniform vec3 cameraPosition;\nuniform float time;\n\n// Default attributes provided by THREE.js. Attributes are only available in the\n// vertex shader. You can pass them to the fragment shader using varyings\nattribute vec3 position;\nattribute vec3 normal;\nattribute vec2 uv;\nattribute vec2 uv2;\n\n// Examples of variables passed from vertex to fragment shader\nvarying vec3 vPosition;\nvarying vec3 vNormal;\nvarying vec2 vUv;\nvarying vec2 vUv2;\n\nvoid main() {\n\n    // To pass variables to the fragment shader, you assign them here in the\n    // main function. Traditionally you name the varying with vAttributeName\n    vNormal = normal;\n    vUv = uv;\n    vUv2 = uv2;\n    vPosition = position;\n\n    // This sets the position of the vertex in 3d space. The correct math is\n    // provided below to take into account camera and object data.\n    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\n}',
	}),
	ramp: AFRAME.registerShader('ramp', {
		fragmentShader: 'precision mediump float;\n\nvarying vec2 vUv;\n\nuniform vec3 color1;\nuniform vec3 color2;\n\nvoid main( void ) {\n    vec3 mixCol = mix( color2, color1, vUv.y );\n\tgl_FragColor = vec4(mixCol, 1.);\n}',
		vertexShader: 'precision highp float;\r\nprecision highp int;\r\n\r\nuniform mat4 modelMatrix;\r\nuniform mat4 modelViewMatrix;\r\nuniform mat4 projectionMatrix;\r\nuniform mat4 viewMatrix;\r\nuniform mat3 normalMatrix;\r\n\r\nattribute vec3 position;\r\nattribute vec3 normal;\r\nattribute vec2 uv;\r\nattribute vec2 uv2;\r\n\r\nvarying vec2 vUv;\r\n\r\nvoid main() {\r\n  vUv = uv;\r\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n}',
		schema: {
			color1: {
				type: 'color',
				glslType: 'vec3',
				default: '#000000',
				is: 'uniform'
			},
			color2: {
				is: 'uniform',
				type: 'color',
				glslType: 'vec3',
				default: '#FFFFFF',

			}
		},
		raw: true
	})
};