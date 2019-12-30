/*jshint esversion: 8*/
/*sourcetype:module */
module.exports = {
	'hand-system': AFRAME.registerSystem('oculus-quest-hands', {
		init: function () {},
		subscribe: function () {

		}
	}),
	'hand': AFRAME.registerComponent('oculus-quest-hands', {
		schema: {
			camera: {
				type: 'selector',
				default: '#vr-camera'
			},
			model: {
				type: 'asset'
			},
			hand: {
				type: 'string',
				default: 'right',
				oneOf: ['right', 'left']
			}
		},
		init: function () {

			this.setOtherHand = function (otherEl) {
				this.otherHandEl = otherEl;
			};

			this.eventHandlers = {};

			this.el.setAttribute('tracked-controls', {
				hand: this.data.hand,
				//headElement: this.data.camera,
				armModel: true,
				autoHide: true,
			});
			this.el.setAttribute('oculus-touch-controls', {
				hand: this.data.hand,
				model: false,
				orientationOffset: {
					x: 0,
					y: 0,
					z: 0
				}
			});
			this.bindMethods = this.bindMethods.bind(this);
			this.bindMethods();
		},
		bindMethods: function () {
			this.onEntityLoaded = this.onEntityLoaded.bind(this);
			this.onModelLoaded = this.onModelLoaded.bind(this);
			this.onController = this.onController.bind(this);
			this.addAnimationClip = this.addAnimationClip.bind(this);
			this.animateHand = this.animateHand.bind(this);
			this.registerEventListeners = this.registerEventListeners.bind(this);
			this.deregisterEventListeners = this.deregisterEventListeners.bind(this);
			//this.grab = this.grab.bind(this);
			this.dirty = null;
			this.getDirty = function () {
				return this.dirty;
			};
			this.setDirty = async function () {
				if (!this.dirty) {
					this.dirty = true;
				}
			};
			this.setDirty = this.setDirty.bind(this);
			this.getDirty = this.getDirty.bind(this);
			this.on = this.on.bind(this);
			this.determineHandGesture = this.determineHandGesture.bind(this);
			this.determineFingerGesture = this.determineFingerGesture.bind(this);
			AFRAME.utils.entity.onLoad(this.el, this.onEntityLoaded, this);
		},
		addAnimationClip: function (animation) {
			this.el.object3DMap.mesh.clips[animation.name] = animation;
			this.el.object3DMap.mesh.actions[animation.name] = this.handMesh.mixer.clipAction(this.el.object3DMap.mesh.clips[animation.name]);
			Object.assign(this.el.object3DMap.mesh.actions[animation.name], this.animationConfig);
		},
		onEntityLoaded: function () {
			var controller = this.el.getAttribute('tracked-controls');
			//console.log(controller);
			if (controller.controller === -1) {
				this.el.addEventListener('controllerconnected', this.onController, {
					once: true
				});
			} else {
				this.onController();
			}
		},
		onController: function () {
			var loader = new THREE.GLTFLoader();
			var data = this.data;
			var self = this;
			loader.load(data.model,
				function (gltf) {
					self.hand = gltf.scene;
					self.handMesh = gltf.scene.getObjectByName(`glove_${data.hand}`);
					self.handMesh.mixer = new THREE.AnimationMixer(self.handMesh);
					self.el.setObject3D('mesh', self.hand);
					AFRAME.utils.entity.onObject3DAdded(self.el, 'mesh', self.onModelLoaded, self, gltf.animations);
				},
				function (xhr) {
					if (data.debug && data.debug == true) {
						console.log(`Model is ${(xhr.loaded / xhr.total * 100)} % loaded`);
					}
				},
				function (err) {
					console.error(err);
				}
			);
		},
		onModelLoaded: function (animations) {
			//var handMaterial = this.el.getAttribute('material');
			this.el.object3DMap.mesh.clips = {};
			this.el.object3DMap.mesh.actions = {};
			this.animationConfig = {
				repetitions: 0,
				time: 0,
				weight: 0,
				loop: THREE.LoopRepeat,
				clampWhenFinished: !0
			};
			animations.forEach(this.addAnimationClip);
			this.hasAnimations = true;
			this.registerEventListeners();

			this.el.setAttribute('collider', {
				group: 'hands'
			});
			this.collider = this.el.components.collider;
		},
		on: function (name, callback) {
			this.eventHandlers[name] = callback;
			this.eventHandlers[name] = this.eventHandlers[name].bind(this);
			this.el.addEventListener(name, this.eventHandlers[name]);
		},
		grab: function () {},
		registerEventListeners: function () {
			var intersections = null;

			this.on('triggertouchstart', function () {
				this.el.removeState('pointing');
				this.setDirty();
			});

			this.on('triggertouchend', function () {
				this.el.addState('pointing');
				this.setDirty();
			});

			this.on('gripdown', function () {
				intersections = this.collider.getIntersections('grabbable', true);
				if (intersections) {
					this.holdingEl = intersections.nearestEl;
					this.holdingEl.setAttribute('constraint', {
						parent: this.el
					});
					this.el.addState('holding-something');
				} else {
					this.el.addState('gripping');
				}
				this.setDirty();
			});

			this.on('gripup', function () {
				if (this.el.is('holding-something')) {
					this.holdingEl.removeAttribute('constraint');
					this.el.removeState('holding-something');
					this.holdingEl = null;
				}

				if (this.el.is('gripping')) {
					this.el.removeState('gripping');
				}

				this.setDirty();
			});

			this.on('constraintchanged', function () {
				if (this.el.is('holding-something')) {
					//console.log(`${this.data.hand} released grip`);
					this.el.removeState('holding-something');
					this.holdingEl = null;
				}

				if (this.el.is('gripping')) {
					this.el.removeState('gripping');
				}

				this.setDirty();
			});

			var onThumbTouchStart = function () {
				this.el.removeState('thumbsup');
				this.setDirty();
			};

			var onThumbTouchEnd = function () {
				this.el.addState('thumbsup');
				this.setDirty();
			};

			this.on('thumbsticktouchstart', onThumbTouchStart);
			this.on('xbuttontouchstart', onThumbTouchStart);
			this.on('ybuttontouchstart', onThumbTouchStart);
			this.on('abuttontouchstart', onThumbTouchStart);
			this.on('bbuttontouchstart', onThumbTouchStart);
			this.on('thumbsticktouchend', onThumbTouchEnd);
			this.on('xbuttontouchend', onThumbTouchEnd);
			this.on('ybuttontouchend', onThumbTouchEnd);
			this.on('abuttontouchend', onThumbTouchEnd);
			this.on('bbuttontouchend', onThumbTouchEnd);
		},
		determineFingerGesture: function (gesture) {
			if (gesture == 'fist' || gesture == 'open') {
				if (this.el.is('pointing')) {
					gesture = gesture + '_point';
				}
				if (this.el.is('thumbsup')) {
					gesture = gesture + '_thumb';
				}
			}
			return gesture;
		},
		determineHandGesture: function () {
			if (this.el.is('gripping')) {
				this.animateHand(this.determineFingerGesture('fist'));
			} else if (!this.el.is('gripping')) {
				this.animateHand(this.determineFingerGesture('open'));
			}
		},
		deregisterEventListeners: function () {},
		animateHand: function (pose) {
			//console.log(pose);
			if (!this.lastPose) {
				this.lastPose = 'open';
			}
			this.handMesh.mixer.stopAllAction();
			if (this.lastPose == pose) {
				this.handMesh.mixer.stopAllAction();
				this.el.object3DMap.mesh.actions[pose].play();
				return;
			}
			this.el.object3DMap.mesh.actions[pose].time = 0;
			this.el.object3DMap.mesh.actions[pose].weight = 1;
			this.el.object3DMap.mesh.actions[pose].play();
			this.el.object3DMap.mesh.actions[pose].time = 0;
			this.el.object3DMap.mesh.actions[this.lastPose].weight = 0;
			this.el.object3DMap.mesh.actions[this.lastPose].play();
			this.el.object3DMap.mesh.actions[this.lastPose].crossFadeTo(this.el.object3DMap.mesh.actions[pose], 0.075, false);
			this.lastPose = pose;
		},
		tick: function (__time, delta) {
			if (this.getDirty()) {
				this.dirty = null;
				this.determineHandGesture();
			}
			if (this.hasAnimations) {
				this.handMesh.mixer.update(delta / 1000);
			}
		}
	})
};