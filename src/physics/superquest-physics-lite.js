/*jshint esversion: 8*/

//const ComponentEmitter = require('component-emitter');
//const StateMachine = require('javascript-state-machine');
const PhysicsWorker = require('./superquest-physics-lite.worker');

module.exports = {
	system: AFRAME.registerSystem('physics', {
		schema: {
			gravity: {
				type: 'vec3',
				default: {
					x: 0,
					y: -3,
					z: 0
				}
			},
			timestep: {
				type: 'number',
				default: 0.03333333
			},
			broadphase: {
				default: 3,
				oneOf: [1, 2, 3]
			},
			iterations: {
				type: 'number',
				default: 1
			},
			poolsize: {
				type: 'number',
				default: 16
			},
			enabled: {
				type: 'boolean',
				default: true
			}
		},
		init: async function () {

			//var sys = this;
			this.Bodies = new Map();

			this.__physics = new PhysicsWorker();

			this.signals = {};
			this.signal = async function (evtName,detail){
				if (this.signals[evtName]){
					this.signals[evtName](detail);
				}
			};
			this.signal = this.signal.bind(this);

			this.on = async function(evtName, callback){
				this.signals[evtName] = callback;
			};

			this.on = this.on.bind(this);

			this.emit = async function (evtName, detail) {
				this.__physics.postMessage({
					type: evtName,
					detail: detail
				});
			};
			this.emit = this.emit.bind(this);

			this.onMessageReceived = async function (evt) {
				this.signal(evt.data.type, {
					detail: evt.data.detail
				});
			};

			this.onMessageReceived=this.onMessageReceived.bind(this);
			this.__physics.addEventListener('message', this.onMessageReceived);

			this.subscribe = async function (id, body) {

				if (!this.hasBodies) {
					this.hasBodies = true;
				}

				this.Bodies.set(id, body);

				this.emit('add-body', {
					BODY_ID: id,
					BODY_CONFIG: body.BODY_CONFIG
				});

			};
			this.subscribe=this.subscribe.bind(this);

			//this.registerPhysicsEvents();
			this.worldConfig = {
				gravity: [this.data.gravity.x, this.data.gravity.y, this.data.gravity.z],
				iterations: this.data.iterations,
				timestep: this.data.timestep,
				broadphase: this.data.broadphase
			};

			this.on('physics-started', () => {
				this.engineActive = true;
			});

			this.on('post-step', (e) => {
				this.workerData = e.detail.bodies;
				this.Bodies.forEach((body) => {
					body.setDirty();
				});
			});

			this.emit('init', {
				WORLD_CONFIG: this.worldConfig
			});

		},
		tick: function () {
			if (!this.engineActive) return;
			if (!this.hasBodies) return;
			this.emit('step', {
				next: true
			});

		}


	}),
	component: AFRAME.registerComponent('physics', {
		dependencies: ['position', 'rotation', 'scale'],
		init: function () {
			this.BODY_ID = `body-${AFRAME.utils.makeId(8)}`;
			this.onEntityLoaded = this.onEntityLoaded.bind(this);
			this.__init = this.__init.bind(this);
			this.dirty = null;
			this.setDirty = async function () {
				if (!this.dirty) {
					this.dirty = true;
				}
			};
			this.owner = 'worker';
			this.syncFromSystem = this.syncFromSystem.bind(this);
			this.setDirty = this.setDirty.bind(this);
			AFRAME.utils.entity.onLoad(this.el, this.onEntityLoaded, this);
		},
		onEntityLoaded: function () {
			AFRAME.utils.entity.onModel(this.el, this.__init, this);
		},
		__init: function () {
			var position = new THREE.Vector3();
			var rotation = new THREE.Vector3();
			rotation.copy(this.el.getAttribute('rotation'));
			this.el.object3D.getWorldPosition(position);

			this.BODY_CONFIG = {
				pos: position.toArray(),
				rot: rotation.toArray(),
				size: [0.25, 0.25, 0.25],
				density: 1,
				friction: 0.2,
				restitution: 0.1,
				move: true
			};

			this.system.subscribe(this.BODY_ID, this);

		},
		syncFromSystem: function () {
			if (this.dirty) {
				this.dirty = null;

				this.workerBody = this.system.workerData.get(this.BODY_ID);
				if (this.workerBody) {
					this.el.object3D.position.copy(this.workerBody.position);
					this.el.object3D.quaternion.copy(this.workerBody.quaternion);
				}
			}
		},

		tick: function () {
			this.syncFromSystem();
		}
	}),
};