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

					if (!this.el.is('holding-something'))
					{
						this.el.addState('holding-something');
						this.holdingEl.emit('grabbed',{handEl: this.el, hand: this.data.hand});
						this.el.emit('grab',{holdingEl: this.holdingEl});
					}

					if (this.holdingEl.components.grabbable)
					{
						this.holdingEl.components.grabbable.onGrab(this);
					}

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
	}),
	'collider-system': AFRAME.registerSystem('collider', {
		schema: {
			debug: {
				type: 'boolean',
				default: true
			}
		},
		init: function () {
			this.colliders = [];
			this.groups = {};
			this.getIntersections = this.getIntersections.bind(this);
			this.subscribe = this.subscribe.bind(this);
			this.__testA = new THREE.Vector3();
			this.__testB = new THREE.Vector3();
			this.__step = 0;
			this.__maxSteps = 0;
			this.__distanceTest = Infinity;
			this.__distanceNearest = Infinity;
			this.__testedNearestEl = null;
		},
		subscribe: function (collider) {
			this.colliders.push(collider);

			if (!this.groups[collider.data.group]) {
				this.groups[collider.data.group] = [];
			}
			this.groups[collider.data.group].push(collider);
		},
		unsubscribe: function (collider) {
			var index = this.colliders.indexOf(collider);
			this.colliders.splice(index, 1);

			if (this.groups[collider.data.group]) {
				index = this.groups[collider.data.group].indexOf(collider);
				this.groups[collider.data.group].splice(index, 1);
			}

		},
		updateMembership: function (collider, oldGroup, group) {
			var index = this.groups[oldGroup].indexOf(collider);

			if (index !== -1) {
				this.groups[oldGroup].splice(index, 1);
			}
			if (!this.groups[group]) {
				this.groups[group] = [];
			}
			index = this.groups[group].indexOf(collider);

			if (index === -1) {
				this.groups[group].push(collider);
			}
			//if (index===-1)
		},
		getIntersections: function (collider, group, force) {
			this.__maxSteps = this.groups[group].length;
			this.__distanceTest = Infinity;
			this.__distanceNearest = Infinity;
			var intersectedEls = [];
			var nearestEl = null;
			if (force && force == true) {
				collider.updateAABB();
			}
			for (this.__step = 0; this.__step < this.__maxSteps; this.__step++) {
				if (force && force == true) {
					this.groups[group][this.__step].updateAABB();
				}
				if (collider.AABB.intersectsBox(this.groups[group][this.__step].AABB) == true && this.groups[group][this.__step].data.enabled == true) {
					intersectedEls.push(this.groups[group][this.__step].el);
					collider.el.object3D.getWorldPosition(this.__testA);
					this.groups[group][this.__step].el.object3D.getWorldPosition(this.__testB);
					this.__distanceTest = this.__testA.distanceToSquared(this.__testB);
					if (this.__distanceTest < this.__distanceNearest) {
						this.__distanceNearest = this.__distanceTest;
						nearestEl = this.groups[group][this.__step].el;
					}
				}
			}
			if (!nearestEl) {
				return null;
			} else {
				return {
					intersectedEls: intersectedEls,
					nearestEl: nearestEl
				};
			}
		},
	}),
	'collider-component': AFRAME.registerComponent('collider', {
		schema: {
			interval: {
				type: 'number',
				default: 40
			},
			group: {
				type: 'string',
				default: 'all'
			},
			collidesWith: {
				type: 'string',
				default: 'none'
			},
			bounds: {
				type: 'string',
				default: 'auto',
				oneOf: ['auto', 'proxy', 'box', 'mesh']
			},
			size: {
				type: 'vec3',
				default: {
					x: 0,
					y: 0,
					z: 0
				}
			},
			static: {
				type: 'boolean',
				default: false
			},
			enabled: {
				type: 'boolean',
				default: true
			},
			autoRefresh: {
				type: 'boolean',
				default: false
			},
		},
		init: function () {

			this.AABB = new THREE.Box3();
			this.createAABBFromAuto = this.createAABBFromAuto.bind(this);
			this.createAABBFromMesh = this.createAABBFromMesh.bind(this);
			this.createAABBFromProxy = this.createAABBFromProxy.bind(this);
			this.createAABBFromBox = this.createAABBFromBox.bind(this);
			this.getIntersections = this.getIntersections.bind(this);
			this.updateIntersections = this.updateIntersections.bind(this);
			this.addIntersection = this.addIntersection.bind(this);
			this.removeIntersection = this.removeIntersection.bind(this);

			this.subscribe = this.subscribe.bind(this);

			this.clearedEls = [];
			this.intersectedEls = [];
			this.nearestEl = null;

			this.__distanceTest = Infinity;
			this.__distanceNearest = Infinity;
			this.__intersections = [];
			this.__intersectionsCleared = [];
			this.__elapsed = 0;

		},
		subscribe: function () {
			if (!this.subscribed) {
				this.system.subscribe(this);
				this.subscribed = true;
				this.el.emit('colliderready',{el: this.el, collider: this},false);
			}
		},
		update: function (oldData) {
			if (!oldData.bounds || oldData.bounds && oldData.bounds !== this.data.bounds)

			{
				switch (this.data.bounds) {
				case 'box':
					this.createAABBFromBox();
					break;
				case 'proxy':
					AFRAME.utils.entity.onObject3DAdded(this.el, 'proxy', this.createAABBFromProxy, this);
					break;
				case 'mesh':
					AFRAME.utils.entity.onModel(this.el, this.createAABBFromMesh, this);
					break;
				case 'auto':
				default:
					AFRAME.utils.entity.onModel(this.el, this.createAABBFromAuto, this);
					break;
				}
			}
			if (oldData.group && oldData.group !== this.data.group) {
				this.system.updateMembership(this, oldData.group, this.data.group);
			}
		},
		createAABBFromAuto: function () {
			//console.log('auto');
			this.AABB.setFromObject(this.el.object3DMap.mesh);
			var size = new THREE.Vector3();
			var center = new THREE.Vector3();
			var positionWorld = new THREE.Vector3();
			this.AABB.getSize(size);
			this.AABB.getCenter(center);
			this.el.object3D.getWorldPosition(positionWorld);
			center.sub(positionWorld);
			size.divide(this.el.object3D.scale);

			this.el.setAttribute('proxy', {
				size: size,
				offset: center
			});

			this.AABB.setFromObject(this.el.object3DMap.proxy);
			var helper = new THREE.Box3Helper(this.AABB);
			this.el.sceneEl.object3D.add(helper);
			this.updateAABB = function () {
				this.AABB.setFromObject(this.el.object3DMap.proxy);
			};
			this.updateAABB = this.updateAABB.bind(this);
			this.subscribe();
		},
		createAABBFromBox: function () {
			var positionWorld = new THREE.Vector3();
			this.el.object3D.getWorldPosition(positionWorld);
			this.AABB.setFromCenterAndSize(positionWorld, this.data.size);
			var helper = new THREE.Box3Helper(this.AABB);
			this.el.sceneEl.object3D.add(helper);

			this.updateAABB = function () {
				this.el.object3D.getWorldPosition(positionWorld);
				this.AABB.setFromCenterAndSize(positionWorld, this.data.size);
			};

			this.updateAABB = this.updateAABB.bind(this);
			this.subscribe();
		},

		createAABBFromProxy: function () {

			this.AABB.setFromObject(this.el.object3DMap.proxy);
			//console.log(this.el.object3DMap);
			//console.log(this.el.object3DMap.proxy);

			var helper = new THREE.Box3Helper(this.AABB);
			this.el.sceneEl.object3D.add(helper);

			this.updateAABB = function () {
				this.AABB.setFromObject(this.el.object3DMap.proxy);
			};

			this.updateAABB = this.updateAABB.bind(this);
			this.subscribe();
		},

		createAABBFromMesh: function () {
			this.AABB.setFromObject(this.el.object3DMap.mesh);

			var size = new THREE.Vector3();
			var center = new THREE.Vector3();
			var positionWorld = new THREE.Vector3();

			this.AABB.getSize(size);
			this.AABB.getCenter(center);
			this.el.object3D.getWorldPosition(positionWorld);

			center.sub(positionWorld);
			size.divide(this.el.object3D.scale);

			var helper = new THREE.Box3Helper(this.AABB);
			this.el.sceneEl.object3D.add(helper);

			this.updateAABB = function () {
				this.AABB.setFromObject(this.el.object3DMap.mesh);
			};

			this.updateAABB = this.updateAABB.bind(this);
			this.subscribe();
		},
		getIntersections: function (group, force) {
			return this.system.getIntersections(this, group, force);
		},
		addIntersection: function (el) {
			if (this.intersectedEls.indexOf(el) === -1) {
				if (this.intersectedEls.length === 0 && !this.el.is('colliding')) {
					this.el.addState('colliding');
				}
				this.intersectedEls.push(el);
				this.el.emit('hitstart', {
					el: el,
					intersectedEls: this.intersectedEls,
					nearestEl: this.nearestEl
				}, false);
				el.emit('hitstart', {
					el: el,
					//intersectedEls: this.intersectedEls
				}, false);
			}
		},
		removeIntersection: function (el) {
			if (this.intersectedEls.indexOf(el) !== -1) {
				var index = this.intersectedEls.indexOf(el);
				this.intersectedEls.splice(index, 1);
				this.el.emit('hitend', {
					clearedEl: el,
					intersectedEls: this.intersectedEls
				}, false);
				el.emit('hitend', {
					clearedEl: el,
					intersectedEls: this.intersectedEls
				}, false);
			}
			if (this.intersectedEls.length === 0 && this.el.is('colliding')) {
				this.el.removeState('colliding');
			}
		},
		updateIntersections: function () {
			if (!this.system.groups[this.data.collidesWith]) return;
			this.__distanceNearest = Infinity;
			this.__distanceTest = 0;
			this.__intersections.splice(0, this.__intersections.length);
			this.__intersectionsCleared.splice(0, this.__intersectionsCleared.length);
			this.__nearestEl = null;
			this.__step = 0;
			this.__stepMax = this.system.groups[this.data.collidesWith].length;
			for (this.__step = 0; this.__step < this.__stepMax; this.__step++) {
				if (this.system.groups[this.data.collidesWith][this.__step].data.enabled == true) {
					if (this.AABB.intersectsBox(this.system.groups[this.data.collidesWith][this.__step].AABB) == true) {
						this.el.object3D.getWorldPosition(this.system.__testA);
						this.system.groups[this.data.collidesWith][this.__step].el.object3D.getWorldPosition(this.system.__testB);
						this.__distanceTest = this.system.__testA.distanceToSquared(this.system.__testB);
						if (this.__distanceTest < this.__distanceNearest) {
							this.__distanceNearest = this.__distanceTest;
							this.__nearestEl = this.system.groups[this.data.collidesWith][this.__step].el;
						}
						this.__intersections.push(this.system.groups[this.data.collidesWith][this.__step].el);
					} else {
						this.__intersectionsCleared.push(this.system.groups[this.data.collidesWith][this.__step].el);
					}
				}
			}
			this.nearestEl = this.__nearestEl;
			this.__stepMax = this.__intersections.length;
			for (this.__step = 0; this.__step < this.__stepMax; this.__step++) {
				this.addIntersection(this.__intersections[this.__step]);
			}
			this.__stepMax = this.__intersectionsCleared.length;
			for (this.__step = 0; this.__step < this.__stepMax; this.__step++) {
				this.removeIntersection(this.__intersectionsCleared[this.__step]);
			}
		},
		tick: function (__t, dt) {
			if (!this.subscribed) return;
			if (this.data.enabled == false) return;

			this.__elapsed = this.__elapsed + dt;
			if (this.__elapsed < this.data.interval) return;
			this.__elapsed = 0;

			if (this.data.static !== true) {
				this.updateAABB();
			}
			if (this.data.autoRefresh === true) {
				this.updateIntersections();
			}
		},
		remove: function () {
			this.system.unsubscribe(this);

			if (this.data.bounds=='auto' && this.el.object3DMap.proxy){
				this.el.removeAttribute('proxy');
			}


		}
	}),
	'speed': AFRAME.registerComponent('speed', {
		dependencies: ['position', 'rotation', 'scale', 'velocity'],
		schema: {
			type: 'vec3',
			default: new THREE.Vector3(0, 0, 0),
		},
		init: function () {}
	}),
	'velocity-system': AFRAME.registerSystem('velocity', {
		schema: {
			interval: {
				type: 'number',
				default: 30
			},
			debug: {
				type: 'boolean',
				default: true
			},
		},
	}),
	'velocity': AFRAME.registerComponent('velocity', {
		dependencies: ['position', 'rotation', 'scale'],
		schema: {
			type: 'vec3',
			default: new THREE.Vector3(0, 0, 0),
		},
		init: function () {
			this.interval = Math.ceil(1000 / this.system.data.interval);
			this.__elapsed = 0;
			this.WorldPosition = new THREE.Vector3();
			this.WorldPositionLast = new THREE.Vector3();
			this.step = new THREE.Vector3();
			this.stepDelta = new THREE.Vector3();
			this.stepNext = new THREE.Vector3();
			//var el = this.el;
			//console.log(this.data);
			if (this.system.data.debug == true) {
				var self = this;
				var textConfig = {
					align: 'center',
					width: '0.25',
					anchor: 'align',
					baseline: 'center',
					wrapCount: 20
				};
				this.speedometer = document.createElement('a-entity');
				var putAbove = function () {
					var box = new THREE.Box3().setFromObject(this.el.object3DMap.mesh);
					var size = new THREE.Vector3();
					box.getSize(size);
					this.speedometer.object3D.translateY((size.y / 2) + 0.1);
				};
				self.el.appendChild(this.speedometer);
				self.speedometer.setAttribute('text', textConfig);
				self.speedometer.updateText = function (msg) {
					msg = String(msg);
					self.speedometer.setAttribute('text', {
						value: msg
					});
				};
				//this.speedometer = speedometer;
				AFRAME.utils.entity.onModel(this.el, putAbove, this);
			}
		},
		tick: function (__t, dt) {
			this.__elapsed += dt;
			if (this.__elapsed < this.interval) return;
			this.__elapsed = 0;
			this.el.object3D.getWorldPosition(this.WorldPosition);
			this.stepDelta.copy(this.WorldPosition).sub(this.WorldPositionLast);
			this.data.copy(this.stepDelta);
			if (this.speedometer) {
				this.speedometer.updateText(
					`x: ${this.data.x.toFixed(2)}, 
y: ${this.data.y.toFixed(2)},
z: ${this.data.z.toFixed(2)}`
				);
			}
			this.WorldPositionLast.copy(this.WorldPosition);
		}
	}),
	'collider-proxy-system': AFRAME.registerSystem('proxy', {
		schema: {
			debug: {
				type: 'boolean',
				default: true
			}
		},
		init: function () {
			this.material = new THREE.MeshBasicMaterial({
				wireframe: true,
				color: 'red',
				visible: this.data.debug
			});
		}
	}),
	'collider-proxy-component': AFRAME.registerComponent('proxy', {
		schema: {
			orient: {
				type: 'vec3',
				default: {
					x: 0,
					y: 0,
					z: 0
				}
			},
			offset: {
				type: 'vec3',
				default: {
					x: 0,
					y: 0,
					z: 0
				}
			},
			size: {
				type: 'vec3',
				default: {
					x: 1,
					y: 1,
					z: 1
				}
			}
		},
		init: function () {
			this.geometry = new THREE.BoxBufferGeometry(
				this.data.size.x,
				this.data.size.y,
				this.data.size.z
			);
			this.proxy = new THREE.Mesh(this.geometry, this.system.material);
			this.setRotation = this.setRotation.bind(this);
			this.setPosition = this.setPosition.bind(this);
			this.setRotation(this.data.orient);
			this.setPosition(this.data.offset);
			this.proxy.visible = this.system.data.debug;
			this.el.setObject3D('proxy', this.proxy);
			this.el.object3DMap.proxy.updateWorldMatrix(true, true);
			this.el.object3DMap.proxy.updateMatrixWorld(true);
		},
		setPosition: function (vec3) {
			this.proxy.position.set(
				vec3.x,
				vec3.y,
				vec3.z
			);
		},
		setRotation: function (vec3) {
			this.proxy.rotation.set(
				THREE.Math.degToRad(vec3.x),
				THREE.Math.degToRad(vec3.y),
				THREE.Math.degToRad(vec3.z)
			);
		},
		remove: function () {
			if (this.el.object3DMap.proxy) this.el.removeObject3D('proxy');
		},
		update: function (oldData) {
			if (!oldData.size) return;
			if (AFRAME.utils.deepEqual(oldData.size, this.data.size) == false) {
				this.remove();
				this.init();
				//console.log('size updated');
				return;
			}
			this.setRotation(this.data.orient);
			this.setPosition(this.data.offset);
		}
	}),
	'constraint': AFRAME.registerComponent('constraint', {
		schema: {
			parent: {
				type: 'selector'
			}
		},
		init: function () {
			this.originalParent = this.el.object3D.parent;
		},
		update: function (oldData) {
			if (!this.data.parent.object3DMap.constraint) {
				this.data.parent.setObject3D('constraint', new THREE.Group());
			}
			this.data.parent.object3DMap.constraint.attach(this.el.object3D);
			this.el.addState(this.data.parent);
			if (oldData.parent && oldData.parent !== this.data.parent) {
				//console.log('constraintchanged');
				this.el.emit('constraintchanged', {
					parent: this.data.parent,
					el: this.el
				}, true);
				oldData.parent.emit('constraintchanged', {
					parent: this.data.parent,
					el: this.el
				}, true);
			}
			if (!oldData.parent) {
				//console.log(this.data.parent);
				this.el.emit('constraintadded', {
					parent: this.data.parent,
					el: this.el
				}, true);
				this.data.parent.emit('constraintadded', {
					parent: this.data.parent,
					el: this.el
				}, true);
			}
		},
		remove: function () {
			//console.log('constraintremoved');
			this.originalParent.attach(this.el.object3D);
			this.el.removeState('constrained');
			this.el.emit('constraintremoved', {
				parent: this.data.parent,
				el: this.el
			}, false);
			this.data.parent.emit('constraintremoved', {
				parent: this.data.parent,
				el: this.el
			}, false);
		}
	}),
	'grabbable': AFRAME.registerComponent('grabbable', {
		schema: {

		},
		init: function () {
			this.onColliderReady = this.onColliderReady.bind(this);
			this.onGrab = this.onGrab.bind(this);

			if (this.el.components.collider && this.el.components.collider.subscribed)	{
				this.onColliderReady();
			} else {
				this.el.addEventListener('colliderready', this.onColliderReady,{once: true});
			}		
		},
		onColliderReady: function(){
			this.originalColliderProperties = AFRAME.utils.getComponentProperty();
		},
		onGrab: function(hand){

		},
		update: function () {

		},
		remove: function () {

		}
	})
};