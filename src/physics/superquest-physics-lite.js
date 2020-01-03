/*jshint esversion: 8*/

//const ComponentEmitter = require('component-emitter');
const StateMachine = require('javascript-state-machine');
const PhysicsWorker = require('./superquest-physics-lite.worker');

var pageBody = function () {
	this.is = 'dynamic';
	this.position = {
		x: 0,
		y: 0,
		z: 0
	};
	this.quaternion = {
		x: 0,
		y: 0,
		z: 0,
		w: 0
	};
};

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

			this.skipper = 0;

			//var sys = this;
			this.Bodies = new Map();
			this.bodyDataToPage = new Map();



			//this.copyFromPage = function(o3)
			this.copyPagePosition = function(src, tgt){
				tgt.x = src.x;
				tgt.y = src.y;
				tgt.z = src.z;

				return tgt;
			};
			

			this.copyPageQuaternion = function(src, tgt){
				tgt.x = src.x;
				tgt.y = src.y;
				tgt.z = src.z;
				tgt.w = src.w;

				return tgt;
			};


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
				this.bodyDataToPage.set(id, body.pageBody);



				this.emit('add-body', {
					BODY_ID: id,
					BODY_CONFIG: body.BODY_CONFIG,
					PAGE_BODY: body.pageBody
				});


			};
			this.subscribe=this.subscribe.bind(this);

			//this.registerPhysicsEvents();
			this.worldConfig = {
				gravity: [this.data.gravity.x, this.data.gravity.y, this.data.gravity.z],
				iterations: this.data.iterations,
				timestep: 1/48,
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

			//this.skipper++;
			//if (this.skipper <= this.data.skip) return;
			//this.skipper=0;

			this.emit('step', {
				pageBodies: this.bodyDataToPage,
				next: true
			});

		}


	}),
	component: AFRAME.registerComponent('physics', {
		dependencies: ['position', 'rotation', 'scale'],
		schema: {
			move:{ type: 'boolean', default: true}
		},
		init: function () {
			this.pageBody = new pageBody();
			this.pageBody.is=(this.data.move===true) ? 'dynamic' : 'kinematic'; 
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
			

			this.syncToSystem = this.syncToSystem.bind(this);
			this.syncFromSystem = this.syncFromSystem.bind(this);

			//this.sync = this.syncFromSystem;

			this.worldPosition = new THREE.Vector3();
			this.worldQuaternion= new THREE.Quaternion();

			this.setDirty = this.setDirty.bind(this);
			AFRAME.utils.entity.onLoad(this.el, this.onEntityLoaded, this);
		},
		onEntityLoaded: function () {
			AFRAME.utils.entity.onModel(this.el, this.__init, this);
		},
		__init: function () {
			var position = new THREE.Vector3();
			var rotation = new THREE.Vector3();
			var body = this;

			

			rotation.copy(body.el.getAttribute('rotation'));
			body.el.object3D.getWorldPosition(position);

			var moves = {
				'dynamic' : true,
				'static' : false,
				'kinematic' : false
			};

			body.BODY_CONFIG = {
				pos: position.toArray(),
				rot: rotation.toArray(),
				size: [0.25, 0.25, 0.25],
				density: 1,
				friction: 0.2,
				restitution: 0.1,
				move: body.data.move
			};

			
			//stateManager = stateManager;
			//body.stateManager.bind(body.stateManager);
			//this.fsm = this.fsm.bind(this);

			var kinemize = async function(e){
				body.sync = body.syncToSystem;
				//body.syncToSystem();
				body.pageBody.is='kinematic';
				body.system.emit('kinemize-body',{
					BODY_ID: body.BODY_ID
				});
			};

			var dynamize = async function(e){
				//body.syncToSystem()
				body.sync = body.syncFromSystem;
				body.pageBody.is='dynamic';
				body.system.emit('dynamize-body',{
					BODY_ID: body.BODY_ID
				});
			};

			body.el.addEventListener('constraintadded',kinemize);
			body.el.addEventListener('constraintremoved',dynamize);

			body.system.subscribe(body.BODY_ID, body);

			body.sync = (body.data.move === true) ? body.syncFromSystem : body.syncToSystem;


			//var lunch = (body.data.move === true) ? this.fsm.dynamize : this.fsm.kinemize;
			//lunch();

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
		syncToSystem: function () {
			
			this.el.object3D.getWorldPosition(this.worldPosition);
			this.el.object3D.getWorldQuaternion(this.worldQuaternion);

			this.system.copyPagePosition(this.worldPosition, this.pageBody.position);
			this.system.copyPageQuaternion(this.worldQuaternion, this.pageBody.quaternion);
			
		},
		tick: function () {
			if (this.sync) this.sync();
		}
	}),
};