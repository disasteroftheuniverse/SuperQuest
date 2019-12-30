/*jshint esversion: 8*/
/*esversion: 8*/
module.exports = {
	portal: AFRAME.registerComponent('portal', {
		schema: {
			camera: {
				type: 'selector'
			},
			interval: {
				type: 'number',
				default: 40
			},
			enabled: {
				type: 'boolean',
				default: true
			},
			canvas: {
				type: 'selector'
			},
			useOffscreen: {
				type: 'boolean',
				default: true
			}
		},
		init: function () {
			this.create = this.create.bind(this);
			this.preStart = this.preStart.bind(this);
			this.camera = null;
			this.mesh = null;
			this.material = new THREE.MeshBasicMaterial();
		},
		create: function () {
			var portal = this;
			var canvas = portal.data.canvas;
			if (portal.data.useOffscreen == true) {
				if (OffscreenCanvas) {
					console.log('offscreen canvas is supported');
					canvas = new OffscreenCanvas(256, 256);
				}
			}
			canvas.style = {
				width: 256,
				height: 256
			};
			portal.material.map = new THREE.CanvasTexture(canvas);
			portal.material.map.needsUpdate = true;
			portal.el.object3D.traverse(node => {
				if (node.material) {
					node.material = portal.material;
					portal.material.needsUpdate = true;
				}
			});
			portal.renderer = new THREE.WebGLRenderer({
				canvas: canvas,
				antialias: false,
				//powerPreference: 'low-power',
				//precision: 'mediump',
			});
			this.rendering = true;
		},
		preStart: function (msg) {
			if (msg) {
				if (msg == 'camera') {
					this.camera = this.data.camera.object3DMap.camera;
				}
				if (msg == 'mesh') {
					this.mesh = this.el.object3DMap.mesh;
				}
			}
			if (!this.mesh || !this.camera) return;
			if (this.el.sceneEl.renderStarted) {
				this.create();
			} else {
				this.el.sceneEl.addEventListener('renderstart', this.create, {
					once: true
				});
			}
		},
		update: function () {
			AFRAME.utils.entity.onObject3DAdded(this.el, 'mesh', this.preStart, this, 'mesh');
			AFRAME.utils.entity.onObject3DAdded(this.data.camera, 'camera', this.preStart, this, 'camera');
			this.tock = AFRAME.utils.throttleTick(this.tock, this.data.interval, this);
		},
		tock: function () {
			if (!this.rendering) return;
			if (this.data.enabled == false) return;
			this.renderer.render(this.el.sceneEl.object3D, this.camera);
			this.material.map.needsUpdate = true;
			this.material.needsUpdate = true;
		},
		remove: function () {}
	}),
	layer: AFRAME.registerComponent('layer', {
		schema: {
			type: 'number',
			default: 0
		},
		init: function () {
			this.addToLayer = this.addToLayer.bind(this);
			this.el.addEventListener('object3dset', this.addToLayer);
		},
		multiple: true,
		addToLayer: function () {
			var el = this.el;
			var data = this.data;
			el.object3D.traverse(node => {
				if (node.layers) {
					node.layers.enable(data);
				}
			});
		},
		update: function () {
			this.addToLayer();
		}
	}),
	layer_set: AFRAME.registerComponent('layer-set', {
		schema: {
			type: 'number',
			default: 0
		},
		init: function () {
			this.addToLayer = this.addToLayer.bind(this);
			this.el.addEventListener('object3dset', this.addToLayer);
		},
		addToLayer: function () {
			var el = this.el;
			var data = this.data;
			el.object3D.traverse(node => {
				if (node.layers) {
					node.layers.set(data);
				}
			});
		},
		update: function () {
			this.addToLayer();
		}
	})
};