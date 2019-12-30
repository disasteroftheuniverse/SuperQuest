/*jshint esversion: 8*/

const ComponentEmitter = require('component-emitter');
//const StateMachine = require('javascript-state-machine');
const PhysicsWorker = require('./physics.worker');

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
			var sys = this;
			sys.__physics = new PhysicsWorker();
			//this.Engine = new Promise ((resolve)=>{resolve( new ComponentEmitter())}) ;


			var mybindMethod = function (method) {
				return new Promise((resolve) => {
					if (method) {
						//method = method.bind(sys);
						//console.log(method);
						resolve(method);
					}
				});
			};

			//mybindMethod = mybindMethod.bind(sys);

			mybindMethod(sys.emit)
				.then(() => {
					sys.Bodies = new Map();
					sys.Engine = new ComponentEmitter();
					return mybindMethod(sys.onMessageReceived);
				})
				.then(() => {
					sys.onMessageReceived = sys.onMessageReceived.bind(sys);
					return mybindMethod(sys.__init);
				})
				.then(() => {
					sys.__init = sys.__init.bind(sys);
					return mybindMethod(sys.subscribe);
				})
				.then(() => {
					sys.subscribe = sys.subscribe.bind(sys);
					return mybindMethod(sys.registerPhysicsEvents);
				})
				.then(() => {
					sys.registerPhysicsEvents = sys.registerPhysicsEvents.bind(sys);
					sys.__init();
				});

		},
		__init: async function () {
			this.__physics.addEventListener('message', this.onMessageReceived);
			this.registerPhysicsEvents();
			this.worldConfig = {
				gravity: [this.data.gravity.x, this.data.gravity.y, this.data.gravity.z],
				iterations: this.data.iterations,
				timestep: this.data.timestep,
				broadphase: this.data.broadphase
			};

			this.emit('init', {
				WORLD_CONFIG: this.worldConfig
			});
		},
		emit: async function (evtName, detail) {
			this.__physics.postMessage({
				type: evtName,
				detail: detail
			});
		},
		subscribe: async function (id, body) {
			//var sys = this;
			if (!this.hasBodies) {
				this.hasBodies = true;
			}
			this.Bodies.set(id, body);
			//console.log(this.Bodies);



			this.emit('add-body', {
				BODY_ID: id,
				BODY_CONFIG: body.BODY_CONFIG
			});

			//body.tick = body.syncFromSystem();
			//body.tick = body.tick.bind(body);
		},
		onMessageReceived: async function (evt) {
			this.Engine.emit(evt.data.type, {
				detail: evt.data.detail
			});
		},
		registerPhysicsEvents: function () {
			this.Engine.on('physics-started', () => {
				this.engineActive = true;
			});
			var sys = this;
			this.Engine.on('post-step', (e) => {
				sys.workerData = e.detail.bodies;
				sys.Bodies.forEach((body) => {
					body.setDirty();
				});
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

			//this.sync.page = this.sync.page

			this.setDirty = this.setDirty.bind(this);
			//this.workerData

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