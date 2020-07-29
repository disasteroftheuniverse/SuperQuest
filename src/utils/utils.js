/*jshint esversion:6*/

AFRAME.utils.entity.onModel = function (modelEl, callback, context) {
	if (context) {
		callback = callback.bind(context);
	}
	var hasMesh = modelEl.getObject3D('mesh');
	var waitForModel = function (e) {
		//console.log(e);
		if (e && e.detail && e.detail.type === 'mesh') {
			callback();
			modelEl.removeEventListener('object3dset', waitForModel);
		}
	};
	if (hasMesh) {
		callback();
	} else {
		modelEl.addEventListener('object3dset', waitForModel);
	}
};
AFRAME.utils.entity.onObject3DAdded = function (el, name, callback, context, args) {
	if (context) {
		callback = callback.bind(context);
	}
	var hasMesh = el.getObject3D(name);
	var waitForCallback = function (e) {
		//console.log(e);
		if (e && e.detail && e.detail.type === name) {
			if (args) {
				callback(args);
			} else {
				callback();
			}
			el.removeEventListener('object3dset', waitForCallback);
		}
	};
	if (hasMesh) {
		//console.log('found the thing');
		if (args) {
			callback(args);
		} else {
			callback();
		}
	} else {
		el.addEventListener('object3dset', waitForCallback);
	}
};
AFRAME.utils.entity.onLoad = function (modelEl, callback, context) {
	if (context) {
		callback = callback.bind(context);
	}
	var waitForCallback = function () {
		callback();
		modelEl.removeEventListener('loaded', waitForCallback);
	};
	if (modelEl.hasLoaded) {
		callback();
	} else {
		modelEl.addEventListener('loaded', waitForCallback, {
			once: true
		});
	}
};
AFRAME.utils.entity.onSceneLoaded = function (el, callback, context) {
	if (context) {
		callback = callback.bind(context);
	}
	//var hasMesh = modelEl.getObject3D('mesh');
	var waitForCallback = function () {
		callback();
		//el.sceneEl.removeEventListener('loaded', waitForCallback);
	};
	//var poller;
	var pollScene = function () {
		if (el.sceneEl.hasLoaded) {
			callback();
		} else {
			setTimeout(pollScene, 100);
		}
	};

	if (el.sceneEl.hasLoaded) {
		callback();
	} else {
		pollScene();
		/*
		el.sceneEl.addEventListener('loaded', waitForCallback, {
			once: true
		});*/
	}
};
AFRAME.utils.device.hasControllers = function () {
	if (navigator) {
		console.log('has navigator!');
		if (navigator.getGamepads) {
			console.log('has gamepad support!');
			var listOfPads = navigator.getGamepads();
			var numberOfControllersConnected = 0;
			if (listOfPads) {
				var connectedGamepads = Object.values(listOfPads);
				connectedGamepads.forEach((gamepadSlot) => {
					if (gamepadSlot) {
						numberOfControllersConnected++;
					}
				});
				if (numberOfControllersConnected > 0) {
					return true;
				} else {
					return null;
				}
			} else {
				return null;
			}

		} else {
			return null;
		}
	} else {
		return null;
	}
};
AFRAME.utils.randomColor = function () {
	var letters = '0123456789ABCDEF';
	var color = '#';
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
};
AFRAME.utils.makeId = function (length) {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
};
AFRAME.utils.__helper__pool = {
	__setDirection: {
		__axis: new THREE.Vector3(),
		__quaternion: new THREE.Quaternion()
		//quaternion: new THREE.Quaternion
	}
};
AFRAME.utils.math = {
	normalize: function (val, max, min) {
		return (val - min) / (max - min);
	},
	/* jshint ignore:start */
	setDirection: function (normal, quaternion) {
		quaternion = quaternion || AFRAME.utils.__helper__pool.__setDirection.__quaternion;
		// vector is assumed to be normalized
		if (normal.y > 0.99999) {
			quaternion.set(0, 0, 0, 1);
		} else if (normal.y < -0.99999) {
			quaternion.set(1, 0, 0, 0);
		} else {
			AFRAME.utils.__helper__pool.__setDirection.__axis.set(normal.z, 0, -normal.x).normalize();
			var radians = Math.acos(normal.y);
			quaternion.setFromAxisAngle(AFRAME.utils.__helper__pool.__setDirection.__axis, radians);
		}
		return quaternion;
	},
	/* jshint ignore:end */
	vectorRadToDeg: function (v) {
		v.set(THREE.Math.radToDeg(v.x), THREE.Math.radToDeg(v.y), THREE.Math.radToDeg(v.z));
		return v;
	},
	vectorRadToDegCopy: function (v) {
		v.x = THREE.Math.radToDeg(v.x);
		v.y = THREE.Math.radToDeg(v.y);
		v.z = THREE.Math.radToDeg(v.z);
		return v;
	},
	vectorDegToRad: function (v) {
		v.set(THREE.Math.degToRad(v.x), THREE.Math.degToRad(v.y), THREE.Math.degToRad(v.z));
		return v;
	}
};
AFRAME.utils.getWhiteEnvironment = function () {
	if (!AFRAME.utils.whiteEnvironment) {
		var uri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAMAAABFaP0WAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF/v7+////G/xoHAAAABBJREFUeNpiYGRkYGQECDAAABIABaUzXMUAAAAASUVORK5CYII=';
		AFRAME.utils.whiteEnvironment = new THREE.CubeTextureLoader().load([
			uri, uri,
			uri, uri,
			uri, uri
		]);
	}
	return AFRAME.utils.whiteEnvironment;
};

AFRAME.utils.shaders = {};
AFRAME.utils.getGradientShader = function (name, colorA, colorB) {
	if (!AFRAME.utils.shaders[name]) {
		var Acolor, Bcolor;
		if (colorA && !colorA.isColor) {
			Acolor = new THREE.Color(colorA);
		} else {
			Acolor = new THREE.Color().copy(colorA);
		}
		if (colorB && !colorB.isColor) {
			Bcolor = new THREE.Color(colorB);
		} else {
			Bcolor = new THREE.Color().copy(colorB);
		}
		AFRAME.utils.shaders[name] = new THREE.RawShaderMaterial({
			fragmentShader: 'precision mediump float;\n\nvarying vec2 vUv;\n\nuniform vec3 color1;\nuniform vec3 color2;\n\nvoid main( void ) {\n    vec3 mixCol = mix( color2, color1, vUv.y );\n\tgl_FragColor = vec4(mixCol, 1.);\n}',
			vertexShader: 'precision highp float;\r\nprecision highp int;\r\n\r\nuniform mat4 modelMatrix;\r\nuniform mat4 modelViewMatrix;\r\nuniform mat4 projectionMatrix;\r\nuniform mat4 viewMatrix;\r\nuniform mat3 normalMatrix;\r\n\r\nattribute vec3 position;\r\nattribute vec3 normal;\r\nattribute vec2 uv;\r\nattribute vec2 uv2;\r\n\r\nvarying vec2 vUv;\r\n\r\nvoid main() {\r\n  vUv = uv;\r\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n}',
			uniforms: {
				color1: {
					type: 'c',
					glslType: 'vec3',
					value: {
						r: Acolor.r,
						g: Acolor.g,
						b: Acolor.b
					},
					description: '',
					textureId: null,
					runtime: {
						texture: null
					}
				},
				color2: {
					type: 'c',
					glslType: 'vec3',
					value: {
						r: Bcolor.r,
						g: Bcolor.g,
						b: Bcolor.b
					},
					description: '',
					textureId: null,
					runtime: {
						texture: null
					}
				}
			}
		});
		//console.log(AFRAME.utils.shaders[name]);
		//if (extraConfig) {}
	}
	return AFRAME.utils.shaders[name];
};
AFRAME.registerComponent('log-object3d', {
	init: function () {
		AFRAME.utils.entity.onModel(this.el, this.log, this);
	},
	log: function () {
		console.log(this.el.object3D);
	}
});

AFRAME.utils.axishelper = function () {
	var originVert = new THREE.Vector3(0, 0, 0);
	var group = new THREE.Group();
	var yGeo = new THREE.Geometry();
	var xGeo = new THREE.Geometry();
	var zGeo = new THREE.Geometry();
	yGeo.vertices.push(originVert, new THREE.Vector3(0, 1, 0));
	xGeo.vertices.push(originVert, new THREE.Vector3(1, 0, 0));
	zGeo.vertices.push(originVert, new THREE.Vector3(0, 0, 1));
	var yLine = new THREE.Line(
		yGeo,
		new THREE.LineBasicMaterial({
			color: 'green'
		})
	);
	var xLine = new THREE.Line(
		xGeo,
		new THREE.LineBasicMaterial({
			color: 'red'
		})
	);
	var zLine = new THREE.Line(
		zGeo,
		new THREE.LineBasicMaterial({
			color: 'blue'
		})
	);
	group.add(yLine);
	group.add(xLine);
	group.add(zLine);
	return group;
};

AFRAME.utils.bindAll = require('lodash.bindall');