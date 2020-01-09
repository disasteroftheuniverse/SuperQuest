/*jshint esversion: 8*/

//const ComponentEmitter = require('component-emitter');
//const StateMachine = require('javascript-state-machine');
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
					y: -9.8,
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

				//console.dir(body.BODY_CONFIG);

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

			this.emit('step', {
				pageBodies: this.bodyDataToPage,
				next: true
			});

		}


	}),
	
	body: AFRAME.registerComponent('body', {
      dependencies: ['position', 'rotation', 'scale'],
      schema: {
         owner: {
            type: 'string',
            default: 'worker',
            oneOf: ['worker', 'page']
         },
         move: {
            type: 'boolean',
            default: true
         },
         density: {
            type: 'number',
            default: 1
         },
         belongsTo: {
            type: 'number',
            default: 1
         },
         collidesWith: {
            type: 'number',
            default: 1
         },
         friction: {
            type: 'number',
            default: 0.2
         },
         restitution: {
            type: 'number',
            default: 0.2
         },
         type: {
            type: 'string',
            default: 'box',
            oneOf: ['box', 'cylinder', 'sphere']
         },
         sleepOn: {
            type: 'string',
            default: 'sleep'
         },
         wakeOn: {
            type: 'string',
            default: 'up'
         },
         constrainOn: {
            type: 'string',
            default: 'grab'
         },
         releaseOn: {
            type: 'string',
            default: 'released'
         },
         forceOn: {
            type: 'string',
            default: 'applyforce'
         },
      },
      multiple: false,
      init: function () {
			//set system
			this.system = this.el.sceneEl.systems.physics;

			//create a container for sending data to/from worker
			this.pageBody = new pageBody();
			this.pageBody.is=(this.data.move===true) ? 'dynamic' : 'kinematic'; 

			this.BODY_ID = `body-${AFRAME.utils.makeId(8)}`;

			//bind methods
			this.initBody = this.initBody.bind(this);
			this.syncToSystem = this.syncToSystem.bind(this);
			this.syncFromSystem = this.syncFromSystem.bind(this);
			this.createShapes = this.createShapes.bind(this);
			this.__createDefaultShape = this.__createDefaultShape.bind(this);
			this.registerEventListeners = this.registerEventListeners.bind(this);

			//create helpers
			this.worldPosition = new THREE.Vector3(); this.worldQuaternion = new THREE.Quaternion();

			//allow system to refresh and update on event from worker
			this.dirty = null;

			this.setDirty = async function () {
				if (!this.dirty) {
					this.dirty = true;
				}
			};
			this.setDirty = this.setDirty.bind(this);
			
			//connect stuff to entity so shape components can find this component
			this.el.oimo = {};

			//wait for entity to load before continuing
			AFRAME.utils.entity.onSceneLoaded(this.el, this.initBody, this);
		},
		
      initBody: function () {
			//check for 'shape' component

         if (!this.el.oimo.shapes) {
            AFRAME.utils.entity.onModel(this.el, this.__createDefaultShape, this);
         } else {
				this.createShapes();
				//AFRAME.utils.entity.onModel(this.el, this.createShapes, this);
			}
			
		},
      createShapes: function () {
			this.el.object3D.updateWorldMatrix(true,true);
			this.el.object3D.updateMatrixWorld(true);

			//if no shape component exists, create a shape from bounding box
         var i = 0;
         var l = this.el.oimo.shapes.length;
         var shape;
         if (l == 0) {
            this.__createDefaultShape();
            return;
			}
			
			//create a shape from shape component
         var pos = new THREE.Vector3();
			var rot = new THREE.Vector3();
			
			this.el.object3D.getWorldPosition(pos);
			
         var types = [];
         var sizes = [];
         var positions = [];
			var rotations = [];

			//insert values into an array for oimo config
         for (i = 0; i < l; i++) {
            shape = this.el.oimo.shapes[i].buildShape();
            types[i] = shape.type;
            sizes[i * 3] = shape.size[0];
            sizes[i * 3 + 1] = shape.size[1];
            sizes[i * 3 + 2] = shape.size[2];
            positions[i * 3] = shape.pos[0];
            positions[i * 3 + 1] = shape.pos[1];
            positions[i * 3 + 2] = shape.pos[2];
            rotations[i * 3] = shape.rot[0];
            rotations[i * 3 + 1] = shape.rot[1];
            rotations[i * 3 + 2] = shape.rot[2];
			}
			
         this.BODY_CONFIG = {
            type: types,
            pos: pos.toArray(),
            rot: rot.copy(this.el.getAttribute('rotation')).toArray(),
            move: this.data.move,
            size: sizes,
            posShape: positions,
            rotShape: rotations,
            density: this.data.density,
            restitution: this.data.restitution,
            friction: this.data.friction,
            collidesWith: this.data.collidesWith,
            belongsTo: this.data.belongsTo,
				name: this.BODY_ID
			};

			this.registerEventListeners();
			//this.system.subscribe(this.BODY_ID, this);

      },
      __createDefaultShape: function () {
			this.el.object3D.updateWorldMatrix(true,true);
			this.el.object3D.updateMatrixWorld(true);

			//create a shape from bounding box
         var pos = new THREE.Vector3();
         var size = new THREE.Vector3();
         var rot = new THREE.Vector3();
         //this.el.object3D.updateMatrixWorld(true);
         this.el.object3D.getWorldPosition(pos);
			var box = new THREE.Box3();
			//var boxhelper = new THREE.Box3Helper(box);
			//this.el.sceneEl.object3D.add(boxhelper);
			
         box.setFromObject(this.el.object3DMap.mesh);
			box.getSize(size);
			
         this.BODY_CONFIG = {
            type: this.data.type,
            move: this.data.move,
            size: size.toArray(),
            pos: pos.toArray(),
            rot: rot.copy(this.el.getAttribute('rotation')).toArray(),
            density: this.data.density,
            restitution: this.data.restitution,
            friction: this.data.friction,
            collidesWith: this.data.collidesWith,
            belongsTo: this.data.belongsTo,
            name: this.BODY_ID,
            allowSleep:true
			};
			
         
			this.registerEventListeners();
			
      },
      registerEventListeners: function () {

			this.kinemize = async function(){
				this.sync = this.syncToSystem;
				this.pageBody.is='kinematic';
				this.system.emit('kinemize-body',{
					BODY_ID: this.BODY_ID
				});
			};
			this.kinemize =this.kinemize.bind(this);
			this.dynamize = async function(){
				this.sync = this.syncFromSystem;
				this.pageBody.is='dynamic';
				this.system.emit('dynamize-body',{
					BODY_ID: this.BODY_ID
				});
			};
			this.dynamize =this.dynamize.bind(this);

			this.el.addEventListener('constraintadded',this.kinemize);
			this.el.addEventListener('constraintremoved',this.dynamize);

			

			this.system.subscribe(this.BODY_ID, this);
			this.sync = (this.data.move === true) ? this.syncFromSystem : this.syncToSystem;

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
   shape:AFRAME.registerComponent('shape', {
      //dependencies: ['body'],
      schema: {
         type: {
            type: 'string',
            default: 'box',
            oneOf: ['box', 'cylinder', 'sphere']
         },
         offset: {
            type: 'vec3',
            default: {
               x: 0,
               y: 0,
               z: 0
            }
         },
         orient: {
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
               x: 0,
               y: 0,
               z: 0
            }
         },
         debug: {
            type: 'boolean',
            default: true
         }
      },
      multiple: true,
      init: function () {
         if (!this.el.oimo) {
            this.el.oimo = {};
         }
         if (!this.el.oimo.shapes) {
            this.el.oimo.shapes = [];
         }
         this.el.oimo.shapes.push(this);
      },
      buildShape: function () {
         var data = this.data;
         var orient = new THREE.Vector3().copy(this.data.orient);
         var offset = new THREE.Vector3().copy(this.data.offset);
         var size = new THREE.Vector3().copy(this.data.size);
         if (this.data.debug == true) {
            var helper = new THREE.Object3D();
            var geometry;
            var edges;
            var line;
            switch (data.type) {
               case 'cylinder':
                  geometry = new THREE.CylinderBufferGeometry(data.size.x, data.size.x, data.size.y, 16, 1);
                  edges = new THREE.EdgesGeometry(geometry);
                  line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
                     color: 0xffffff
                  }));
                  helper.add(line);
                  //size=[data.size.x,data.size.x,data.size.y];
                  break;
               case 'sphere':
                  geometry = new THREE.SphereBufferGeometry(data.size.x, 12, 8);
                  edges = new THREE.EdgesGeometry(geometry);
                  line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
                     color: 0xffffff
                  }));
                  helper.add(line);
                  break;
               case 'box':
               default:
                  geometry = new THREE.BoxBufferGeometry(data.size.x, data.size.y, data.size.z);
                  edges = new THREE.EdgesGeometry(geometry);
                  line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
                     color: 0xffffff
                  }));
                  helper.add(line);
                  //break;
				}
				
            this.el.object3D.updateMatrixWorld(true);
				this.el.object3D.add(helper);
				
            helper.updateMatrixWorld(true);
            helper.translateX(offset.x);
            helper.translateY(offset.y);
            helper.translateZ(offset.z);
            helper.rotateX(orient.x);
            helper.rotateY(orient.y);
            helper.rotateZ(orient.z);
				helper.updateMatrixWorld(true);
				
         }
         return {
            type: data.type,
            pos: offset.toArray(),
            rot: orient.toArray(),
            size: size.toArray()
         };
      }
   })
};
