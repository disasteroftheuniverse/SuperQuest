/*jshint esversion: 8*/
/*sourcetype:module */
//require('aframe');
module.exports = {
	'group-system': AFRAME.registerSystem('grp', {
		init: async function () {
			var members = [];
			var groups = new Map();
			groups.set('hands', [])
				.set('grabbable', [])
				.set('hoverable', [])
				.set('droppable', [])
				.set('draggable', [])
				.set('empty', [])
				.set('all', []);
			this.subscribe = async function (member) {
				var index, group;
				index = members.indexOf(member.el);
				if (index === -1) {
					members.push(member.el);
				}
				if (!groups.has(member.id)) {
					groups.set(member.id, []);
				}
				group = groups.get(member.id);
				index = group.indexOf(member.el);
				if (index === -1) {
					group.push(member.el);
				}
				//console.log(groups);
			};
			this.subscribe = this.subscribe.bind(this);
			this.unsubscribe = async function (member) {
				var index, group;
				index = members.indexOf(member.el);
				if (index === -1) {
					console.log('not a member');
					return;
				}
				if (!groups.has(member.id)) {
					console.log('group does not exist');
					return;
				}
				group = groups.get(member.id);
				index = group.indexOf(member.el);
				if (index === -1) {
					console.log('not a member of group');
					return;
				}
				group.splice(index, 1);
				//console.log(groups);
			};
			this.unsubscribe = this.unsubscribe.bind(this);
			this.getGroup = function (group) {
				//console.log()
				if (!groups.has(group)) return groups.get('empty');
				return groups.get(group);
			};
			this.getGroup = this.getGroup.bind(this);
			this.hasGroup = function (group) {
				return (groups.has(group) == true) ? true : null;
			};
			this.hasGroup = this.hasGroup.bind(this);
		}
	}),
	'group': AFRAME.registerComponent('grp', {
		multiple: true,
		init: async function () {
			if (!this.id) return;
			this.system.subscribe(this);
		},
		remove: async function () {
			if (!this.id) return;
			this.system.unsubscribe(this);
		}
	}),
	'hand-alignments': AFRAME.registerComponent('hand-aligns', {
		schema: {
			src: {
				type: 'asset'
			},
			hand: {
				type: 'string',
				oneOf: ['left', 'right']
			},
			debug: {
				type: 'boolean',
				default: false
			},
		},
		multiple: true,
		init: function () {
			var el = this.el;
			var hand = this.data.hand;
			var debug = this.data.debug;
			var loader = new THREE.ObjectLoader();
			loader.load(this.data.src,
				(obj) => {
					obj.children.forEach(node => {
						var pos = node.position;
						var rot = AFRAME.utils.math.vectorRadToDeg(node.rotation.toVector3(new THREE.Vector3()));
						if (hand === 'left') {
							pos.x = pos.x * -1;
							rot.y = rot.y * -1;
						}
						el.setAttribute(node.name, {
							offset: pos,
							orient: rot
						});
						//var labelPos = AFRAME.utils.styleParser.parse({x: node.position.x,y: node.position.y, z: node.position.z});

						if (debug === true) {
							var label = `<a-text position="${node.position.x} ${node.position.y} ${node.position.z}"  
						scale="0.1 0.1 0.1" look-at="#vr-camera" value="${node.name}" text="align: center; width: 1;"></a-text>`;
							el.insertAdjacentHTML('afterbegin', label);
						}

					});
				}
			);
		},
		remove: function () {

		}
	}),
	'hand': AFRAME.registerComponent('oculus-quest-hands', {
		schema: {
			camera: {
				type: 'selector',
				default: '#vr-camera'
			},
			src: {
				type: 'asset'
			},
			hand: {
				type: 'string',
				default: 'right',
				oneOf: ['right', 'left']
			},
			alignSrc: {
				type: 'asset'
			},
			debug: {
				type: 'boolean',
				default: true
			},
		},
		init: function () {
			this.el.setAttribute('grp__hands', '');
			this.el.setAttribute(`grp__hand${this.data.hand}`, '');
			this.setOtherHand = function (otherEl) {
				this.otherHandEl = otherEl;
			};
			this.eventHandlers = {};
			this.el.setAttribute('tracked-controls', {
				hand: this.data.hand,
				headElement: this.data.camera,
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
			//this.onController = this.onController.bind(this);
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
			var loader = new THREE.GLTFLoader();
			var data = this.data;
			var self = this;
			loader.load(data.src,
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
				debug: this.data.debug,
				autoRefresh: true,
				static: false,
				interval: 10
			});
			this.collider = this.el.components.collider;
			this.el.setAttribute('hand-aligns', {
				hand: this.data.hand,
				src: this.data.alignSrc,
				debug: this.data.debug
			});
		},
		on: function (name, callback) {
			callback = callback.bind(this);
			this.eventHandlers[name] = callback;
			this.el.addEventListener(name, this.eventHandlers[name]);
		},
		registerEventListeners: function () {
			var intersections = null;
			var self = this;

			self.onTriggerTouchStart = function () {

				self.el.removeState('pointing');
				self.setDirty();
			};

			self.onTriggerTouchEnd = function () {
				if (!self.el.is('holding-something')) {
					self.el.addState('pointing');
				}
				self.setDirty();
			};

			self.onGripDown = function () {
				intersections = self.collider.getIntersections('grabbable', true);
				if (intersections) {
					self.holdingEl = intersections.nearestEl;
					self.holdingEl.setAttribute('constraint', {
						parent: self.el
					});
					if (!self.el.is('holding-something')) {
						self.el.addState('holding-something');
						self.holdingEl.emit('grabbed', {
							handEl: self.el,
							hand: self.data.hand
						});
						self.el.emit('grab', {
							holdingEl: self.holdingEl
						});
					}
					if (self.holdingEl.components.grabbable) {
						self.holdingEl.components.grabbable.grab(self);
						self.holdPose = self.holdingEl.components.grabbable.data.pose;


					}
					self.el.addState('pose');
				} else {
					self.el.addState('gripping');
				}
				self.setDirty();
			};

			self.onGripUp = function () {
				if (self.el.is('holding-something')) {

					if (self.holdingEl.components.grabbable) {
						self.holdingEl.components.grabbable.release(self);
					}

					self.holdingEl.removeAttribute('constraint');
					self.el.removeState('holding-something');

					self.holdPose = null;

					self.holdingEl.emit('released', {
						handEl: self.el,
						hand: self.data.hand
					});

					self.el.emit('release', {
						holdingEl: self.holdingEl
					});

					self.holdingEl = null;
				}
				if (self.el.is('gripping')) {
					self.el.removeState('gripping');
				}
				self.setDirty();
			};

			self.onConstraintChanged = function () {
				if (self.el.is('holding-something')) {
					//console.log(`${self.data.hand} released grip`);
					self.el.removeState('holding-something');
					self.holdingEl = null;
					self.holdPose = null;
				}
				if (self.el.is('gripping')) {
					self.el.removeState('gripping');
				}
				self.setDirty();
			};

			self.onThumbTouchStart = function () {
				self.el.removeState('thumbsup');
				self.setDirty();
			};

			self.onThumbTouchEnd = function () {
				if (!self.el.is('holding-something')) {
					self.el.addState('thumbsup');
				}
				self.setDirty();
			};

			self.el.addEventListener('gripdown', self.onGripDown);
			self.el.addEventListener('gripup', self.onGripUp);

			self.el.addEventListener('constraintchanged', self.onConstraintChanged);

			self.el.addEventListener('triggertouchend', self.onTriggerTouchEnd);
			self.el.addEventListener('triggertouchstart', self.onTriggerTouchStart);

			self.el.addEventListener('thumbsticktouchstart', self.onThumbTouchStart);
			self.el.addEventListener('xbuttontouchstart', self.onThumbTouchStart);
			self.el.addEventListener('ybuttontouchstart', self.onThumbTouchStart);
			self.el.addEventListener('abuttontouchstart', self.onThumbTouchStart);
			self.el.addEventListener('bbuttontouchstart', self.onThumbTouchStart);
			self.el.addEventListener('thumbsticktouchend', self.onThumbTouchEnd);
			self.el.addEventListener('xbuttontouchend', self.onThumbTouchEnd);
			self.el.addEventListener('ybuttontouchend', self.onThumbTouchEnd);
			self.el.addEventListener('abuttontouchend', self.onThumbTouchEnd);
			self.el.addEventListener('bbuttontouchend', self.onThumbTouchEnd);
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
			if (this.el.is('gripping') && !this.el.is('holding-something')) {
				this.animateHand(this.determineFingerGesture('fist'));
			} else if (!this.el.is('gripping') && !this.el.is('holding-something')) {
				this.animateHand(this.determineFingerGesture('open'));
			} else if (this.el.is('holding-something') && this.holdPose !== null) {
				this.animateHand(this.holdPose);
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
			this.el.object3DMap.mesh.actions[this.lastPose].crossFadeTo(this.el.object3DMap.mesh.actions[pose], 0.11, true);
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
	'grabbable': AFRAME.registerComponent('grabbable', {
		dependencies: ['collider'],
		schema: {
			enabled: {
				type: 'boolean',
				default: true
			},
			handAlign: {
				type: 'string',
				default: 'none'
			},
			pose: {
				type: 'string',
				default: 'gun'
			},
			centerAlign: {
				type: 'string',
				default: 'none'
			},
			debug: {
				type: 'boolean',
				default: 'false'
			}
		},
		init: function () {
			this.grab = this.grab.bind(this);
			this.release = this.release.bind(this);
			this.align = this.align.bind(this);

			this.registerEventListeners = this.registerEventListeners.bind(this);
			this.el.setAttribute('grp__grabbable', '');


			this.originalColliderProperties = JSON.parse(JSON.stringify(AFRAME.utils.entity.getComponentProperty(this.el, 'collider')));

			if (this.originalColliderProperties.bounds) {
				delete this.originalColliderProperties.bounds;
			}

			this.targetPosition = new THREE.Vector3();
			this.targetQuaternion = new THREE.Quaternion();
			this.intermediatePos = new THREE.Vector3();
			this.intermediateQuat = new THREE.Quaternion();
			this.startPos = new THREE.Vector3();
			this.startQuat = new THREE.Quaternion();

			this.weight = {
				value: 0
			};


			this.registerEventListeners();
		},
		registerEventListeners: function () {
			//this.el.addEventListener('grabbed', this.onGrabbed);
			//this.el.addEventListener('released', this.onReleased);
		},
		grab: function (hand) {

			this.el.setAttribute('collider', {
				autoRefresh: false,
				static: false,
				interval: 20
			});

			if (this.handAlign !== 'none' && hand.el.components[`align__${this.data.handAlign}`]) {
				console.log(this);
				this.align(hand.el.object3DMap[`align__${this.data.handAlign}`]);
			}


		},
		align: function (alignTo) {
			this.targetPosition.copy(alignTo.position);
			this.targetQuaternion.copy(alignTo.quaternion);

			this.startPos.copy(this.el.object3D.position);
			this.startQuat.copy(this.el.object3D.quaternion);

			var component = this;

			AFRAME.ANIME.remove(component.weight);
			AFRAME.ANIME({
				targets: component.weight,
				value: [0, 1],
				duration: 200,
				easing: 'easeInOutSine',
				complete: function () {
					AFRAME.ANIME.remove(component.weight);
				},
				update: function () {
					component.intermediatePos.lerpVectors(component.startPos, component.targetPosition, component.weight.value);
					THREE.Quaternion.slerp(component.startQuat, component.targetQuaternion, component.intermediateQuat, component.weight.value);

					if (component.el.is('constrained')) {
						component.el.object3D.position.copy(component.intermediatePos);
						component.el.object3D.quaternion.copy(component.intermediateQuat);
					}
				}
			});

			//this.align.weight


		},
		release: function (hand) {
			console.log(hand);
			this.el.setAttribute('collider', this.originalColliderProperties);
		}
	}),
	'collider-component': AFRAME.registerComponent('collider', {
		schema: {
			interval: {
				type: 'number',
				default: 40
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
			debug: {
				type: 'boolean',
				default: false
			},
		},
		init: function () {
			this.el.setAttribute('grp__colliders', '');
			this.groupManager = this.el.sceneEl.systems.grp;
			this.__testA = new THREE.Vector3();
			this.__testB = new THREE.Vector3();
			this.AABB = new THREE.Box3();

			if (this.data.debug === true) {
				var helper = new THREE.Box3Helper(this.AABB);
				this.el.sceneEl.object3D.add(helper);
			}
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
				//this.system.subscribe(this);
				this.subscribed = true;
				this.el.emit('colliderready', {
					el: this.el,
					collider: this
				}, false);
			}
		},
		update: function (oldData) {
			if (!oldData.bounds || oldData.bounds && oldData.bounds !== this.data.bounds) {
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
			/*
			if (oldData.group && oldData.group !== this.data.group) {
				this.system.updateMembership(this, oldData.group, this.data.group);
			}*/
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
			this.updateAABB = function () {
				this.el.object3D.getWorldPosition(positionWorld);
				this.AABB.setFromCenterAndSize(positionWorld, this.data.size);
			};
			this.updateAABB = this.updateAABB.bind(this);
			this.subscribe();
		},
		createAABBFromProxy: function () {
			this.AABB.setFromObject(this.el.object3DMap.proxy);
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
			this.updateAABB = function () {
				this.AABB.setFromObject(this.el.object3DMap.mesh);
			};
			this.updateAABB = this.updateAABB.bind(this);
			this.subscribe();
		},
		getIntersections: function (group, force) {
			var collideGroup = this.groupManager.getGroup(group);
			var maxSteps = collideGroup.length;
			if (maxSteps < 1) return null;
			if (force && force == true) {
				this.updateAABB();
			}
			var distanceTest = Infinity;
			var distanceNearest = Infinity;
			var intersectedEls = [];
			var nearestEl = null;
			var collider;
			for (var step = 0; step < maxSteps; step++) {
				collider = collideGroup[step].components.collider;
				if (force && force == true) {
					collider.updateAABB();
				}
				if (this.AABB.intersectsBox(collider.AABB) == true && collider.data.enabled == true) {
					intersectedEls.push(collider.el);
					this.el.object3D.getWorldPosition(this.__testA);
					collider.el.object3D.getWorldPosition(this.__testB);
					distanceTest = this.__testA.distanceToSquared(this.__testB);
					if (distanceTest < distanceNearest) {
						distanceNearest = distanceTest;
						nearestEl = collider.el;
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
			var collideGroup = this.groupManager.getGroup(this.data.collidesWith);
			this.__stepMax = collideGroup.length;
			if (this.__stepMax < 1) return;
			this.__distanceNearest = Infinity;
			this.__distanceTest = 0;
			this.__intersections.splice(0, this.__intersections.length);
			this.__intersectionsCleared.splice(0, this.__intersectionsCleared.length);
			this.__nearestEl = null;
			this.__step = 0;
			var collider;
			for (this.__step = 0; this.__step < this.__stepMax; this.__step++) {
				collider = collideGroup[this.__step].components.collider;
				if (collider.data.enabled == true) {
					if (this.AABB.intersectsBox(collider.AABB) == true) {
						this.el.object3D.getWorldPosition(this.__testA);
						collider.el.object3D.getWorldPosition(this.__testB);
						this.__distanceTest = this.__testA.distanceToSquared(this.__testB);
						if (this.__distanceTest < this.__distanceNearest) {
							this.__distanceNearest = this.__distanceTest;
							this.__nearestEl = collider.el;
						}
						this.__intersections.push(collider.el);
					} else {
						this.__intersectionsCleared.push(collider.el);
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
			//this.system.unsubscribe(this);
			if (this.data.bounds == 'auto' && this.el.object3DMap.proxy) {
				this.el.removeAttribute('proxy');
			}
		}
	}),
	'collider-proxy-system': AFRAME.registerSystem('proxy', {
		schema: {
			debug: {
				type: 'boolean',
				default: false
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
			this.el.addState('constrained');
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
	'aligner': AFRAME.registerComponent('align', {
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
			debug: {
				type: 'boolean',
				default: false
			}
		},
		multiple: true,
		init: function () {
			if (!this.id) return;

			this.origin = new THREE.Group();

			if (this.data.debug == true) {
				this.helper = AFRAME.utils.axishelper();
				this.origin.add(this.helper);
				this.helper.scale.multiplyScalar(0.01);
			}


			this.setRotation = this.setRotation.bind(this);
			this.setPosition = this.setPosition.bind(this);

			this.origin.name = this.id;

			
			this.el.setObject3D(`align__${this.id}`, this.origin);
		},
		setPosition: function (vec3) {
			this.origin.position.set(
				vec3.x,
				vec3.y,
				vec3.z
			);
		},
		setRotation: function (vec3) {
			this.origin.rotation.set(
				THREE.Math.degToRad(vec3.x),
				THREE.Math.degToRad(vec3.y),
				THREE.Math.degToRad(vec3.z)
			);
		},
		remove: function () {
			if (this.el.object3DMap[`align__${this.id}`]) this.el.removeObject3D(`align__${this.id}`);
		},
		update: function () {
			if (!this.id) return;
			this.setRotation(this.data.orient);
			this.setPosition(this.data.offset);
			this.origin.visible = this.data.debug;
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
	})
};