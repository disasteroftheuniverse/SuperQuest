/*jshint esversion: 8*/


//require('./../../node_modules/');
module.exports = {
   'collider-system': AFRAME.registerSystem('collider', {
      schema: {
         debug: { type: 'boolean', default: true }
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
      updateMembership: function (collider) {

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
            return { intersectedEls: intersectedEls, nearestEl: nearestEl };
         }
      },

   }),
   'collider-component': AFRAME.registerComponent('collider', {
      schema: {
         interval: { type: 'number', default: 40 },
         group: { type: 'string', default: 'all' },
         collidesWith: { type: 'string', default: 'none' },

         bounds: { type: 'string', default: 'auto', oneOf: ['auto', 'proxy', 'box', 'mesh'] },

         size: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },

         static: { type: 'boolean', default: false },

         enabled: { type: 'boolean', default: true },

      },
      init: function () {
         this.AABB = new THREE.Box3();

         this.onEntityLoaded = this.onEntityLoaded.bind(this);
         this.onModelLoaded = this.onModelLoaded.bind(this);

         this.createAABB_Auto = this.createAABB_Auto.bind(this);
         this.createAABB_Mesh = this.createAABB_Mesh.bind(this);
         this.createAABB_Proxy = this.createAABB_Proxy.bind(this);
         this.createAABB_Box = this.createAABB_Box.bind(this);


         this.onEntityLoaded = this.onEntityLoaded.bind(this);

         this.getIntersections = this.getIntersections.bind(this);
         this.updateIntersections = this.updateIntersections.bind(this);
         this.addIntersection = this.addIntersection.bind(this);
         this.removeIntersection = this.removeIntersection.bind(this);

         //this.createAABB_Auto = this.createAABB.auto.bind(this);


         this.clearedEls = [];
         this.intersectedEls = [];
         this.nearestEl = null;

         this.__distanceTest = Infinity;
         this.__distanceNearest = Infinity;
         this.__intersections = [];
         this.__intersectionsCleared = [];

         this.__elapsed = 0; var component = this; //var objmap = component.el.object3DMap;

         //console.log(moops);
         //AFRAME.utils.entity.onLoad(this.el, this.onEntityLoaded, this);
      },
      update: function (oldData) {
         if (!oldData.bounds) {
            switch (this.data.bounds) {
               case 'box':
                  AFRAME.utils.entity.onElLoaded(this.el, this.onEntityLoaded, this, this.createAABB_Auto);
                  break;
               case 'auto':
                  AFRAME.utils.entity.onElLoaded(this.el, this.onEntityLoaded, this, this.createAABB_Auto);
                  break;
            }
         }
      },
      onEntityLoaded: function (type) {
         AFRAME.utils.entity.onObject3DAdded(this.el, 'mesh', this.onModelLoaded, this, type);
      },
      onModelLoaded: function (type) {
         type();
      },
      createAABB_Auto: function () {
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
         this.system.subscribe(this);
         this.subscribed = true;
      },
      createAABB_Box: function () {
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
         this.system.subscribe(this);
         this.subscribed = true;
      },
      createAABB_Proxy: function () {
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
         this.system.subscribe(this);
         this.subscribed = true;
      },
      createAABB_Mesh: function () {
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
         this.system.subscribe(this);
         this.subscribed = true;
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

            this.el.emit('hitstart', { el: el, intersectedEls: this.intersectedEls, nearestEl: this.nearestEl }, false);
            el.emit('hitstart', { el: el, intersectedEls: this.intersectedEls }, false);
         }

      },
      removeIntersection: function (el) {

         if (this.intersectedEls.indexOf(el) !== -1) {

            var index = this.intersectedEls.indexOf(el);
            this.intersectedEls.splice(index, 1);

            this.el.emit('hitend', { clearedEl: el, intersectedEls: this.intersectedEls }, false);
            el.emit('hitend', { clearedEl: el, intersectedEls: this.intersectedEls }, false);


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

         this.__step = 0; this.__stepMax = this.system.groups[this.data.collidesWith].length;
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
                  //this.removeIntersection(this.system.groups[this.data.collidesWith][this.__step].el);
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

         if (this.data.collidesWith !== 'none') {
            this.updateIntersections();
         }

      }
   }),
   'speed': AFRAME.registerComponent('speed', {
      dependencies: ['position', 'rotation', 'scale', 'velocity'],
      schema: {
         type: 'vec3',
         default: new THREE.Vector3(0, 0, 0),
      },
      init: function () {

      }
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
               align: 'center', width: '0.25', anchor: 'align', baseline: 'center', wrapCount: 20
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
               self.speedometer.setAttribute('text', { value: msg });
            };

            //this.speedometer = speedometer;
            AFRAME.utils.entity.onModel(this.el, putAbove, this);
         }
      }, tick: function (__t, dt) {

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
         debug: { type: 'boolean', default: true }
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
         orient: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
         offset: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
         size: { type: 'vec3', default: { x: 1, y: 1, z: 1 } }
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
            this.remove(); this.init();
            //console.log('size updated');
            return;
         }

         this.setRotation(this.data.orient);
         this.setPosition(this.data.offset);

      }
   }),
   'constraint': AFRAME.registerComponent('constraint', {
      schema: {
         parent: { type: 'selector' }
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

            this.el.emit('constraintchanged', { parent: this.data.parent, el: this.el }, true);
            oldData.parent.emit('constraintchanged', { parent: this.data.parent, el: this.el }, true);

         }

         if (!oldData.parent) {
            //console.log(this.data.parent);

            this.el.emit('constraintadded', { parent: this.data.parent, el: this.el }, true);
            this.data.parent.emit('constraintadded', { parent: this.data.parent, el: this.el }, true);

         }



      },
      remove: function () {
         //console.log('constraintremoved');
         this.originalParent.attach(this.el.object3D);
         this.el.removeState('constrained');

         this.el.emit('constraintremoved', { parent: this.data.parent, el: this.el }, false);
         this.data.parent.emit('constraintremoved', { parent: this.data.parent, el: this.el }, false);
      }
   }),
   old: {
   /*aabb_lite_system: AFRAME.registerSystem('collider', {
      schema: {
         debug: { type: 'boolean', default: true },
      },
      init: function () {
         var id = AFRAME.utils.makeId(8);
         this.colliderSharedGroup = `aabb-${id}`;
         this.boxMat = new THREE.MeshBasicMaterial({ wireframe: true });

         this.subscribe = this.subscribe.bind(this);

         this.unsubscribe = this.unsubscribe.bind(this);

         this._updateGroups = this._updateGroups.bind(this);

         this._refreshGroupAABBs = this._refreshGroupAABBs.bind(this);

         this._refreshObjects = this._refreshObjects.bind(this);

         this.AABBs = [];




      },
      subscribe: async function (component) {
         this.AABBs.push(component);
         this._refreshObjects();
      },
      unsubscribe: async function (component) {
         var index = this.AABBs.indexOf(component);
         this.AABBs.splice(index, 1);
         this._refreshObjects();
      },
      _updateGroups: function (component) {

      },
      _refreshGroupAABBs: function (group, force) {


      },
      _refreshObjects: async function () {
         var j = this.AABBs.length;
         for (var i = 0; i < j; i++) {
            this.AABBs[i].setDirty(true);
         }
      },
      update: function () {

      }
   }),
   aabb_lite: AFRAME.registerComponent('collider', {
      schema: {
         objects: { type: 'string' },
         interval: { type: 'number', default: 40 },

         static: { type: 'boolean', default: true },
         autoRefresh: { type: 'boolean', default: false },

         debug: { type: 'boolean', default: true },

         enabled: { type: 'boolean', default: false },
         size: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
         offset: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
         orient: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },

         bounds: { type: 'string', default: 'auto', oneOf: ['auto', 'size', 'proxy','mesh'] },
      },
      multiple: false,
      init: function () {
         this.el.hasAABB = null;
         this.AABB = new THREE.Box3();

         var dirty = null;
         this.dirty = function(){
            return dirty;
         };

         this.resetDirty = function(){
            dirty = null;
         };
         this.setDirty = async function(){
            dirty=true;
         };

         this.refreshObjects = this.refreshObjects.bind(this);

         this.dirty = this.dirty.bind(this);
         this.setDirty = this.setDirty.bind(this);
         this.resetDirty = this.resetDirty.bind(this);

         this.objects = [];
         this.intersectingEls = [];
         this.nearestEl = null;
         this.clearedEls = [];
      },
      refreshObjects: function(){
         
      },
      update: function(oldData){
         //if (!oldData.bounds) return;
         switch (this.data.bounds){

         }
      }
   

   }),*/},

};
