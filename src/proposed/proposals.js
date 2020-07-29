AFRAME.registerComponent('tool-menu', {
   dependencies:['position','rotation','scale','tracked-controls'],
   schema:{ hand: { type: 'string' , default:'left' }, },
   init: function () {
      if (!this.el.sceneEl.systems.player) throw new Error(`Player system not found`);
      this.system = this.el.sceneEl.systems.player;
      this.refreshAxis = this.refreshAxis.bind(this);
      let size = 0.01;
      let axisEl = document.createElement('a-entity');
      axisEl.setAttribute('geometry', { primitive: 'box', width: size, height: size, depth: size });
      axisEl.setAttribute('position', { x: 0, y: 0.05, z: 0 });
      this.text = document.createElement('a-entity');
      this.text.setAttribute('text', {align: 'center', anchor: 'align', width: 0.2, wrapCount: 16, color: 'red', value: 'Foo bar'});
      this.text.setAttribute('position', { x: 0, y: 0.15, z: 0 });
      this.el.appendChild(this.text);
      this.el.appendChild(axisEl);
      this.axis = new THREE.Vector2();
      this.angle =0;
      //this.helper = new THREE.Vector2();
      this.el.addEventListener('axismove', this.refreshAxis);
   }, 
   refreshAxis: function ({ detail: { axis }}) {
      this.axis.setX(axis[2]);
      this.axis.setY(axis[3]);
      this.angle = this.axis.angle();
   }, 
   tick: function(time,delta){
   }
});

AFRAME.registerComponent('pie', {
   schema:{
      slices: {
         type: 'number',
         default: 5
      },
      divisions: {
         type: 'number',
         default: 24
      },
      radiusInner: {
         type: 'number',
         default: 0.001
      },
      radiusOuter: {
         type: 'number',
         default: 0.125
      },
      rings: {
         type: 'number',
         default: 2
      },
   },
   multiple: false,
   init: function () {
      this.create = this.create.bind(this);
      this.create();
   }, 
   create: function(){
      let divisions = this.data.divisions;
      let step = 0;
      //var geometry = new THREE.CircleGeometry( 0.125, this.data.slices * divisions );
      var geometry = new THREE.RingGeometry( this.data.radiusInner, this.data.radiusOuter, this.data.slices * divisions, 1 );
      var randomColor = () => '#'+Math.floor(Math.random()*16777215).toString(16);
      var randomThreeColor = () => new THREE.Color(randomColor());
      let sliceDivisions =  divisions;
      var currentColor = randomThreeColor();
      let material = new THREE.MeshBasicMaterial({color: currentColor});
      let slices = new THREE.Object3D();
      let sliceGeo = new THREE.Geometry();
      let midsize = 0.01;
      let midMat = new THREE.MeshBasicMaterial({color: 0xff0000});
      let middleGeo = new THREE.BoxGeometry(midsize,midsize,midsize);
      let centerpoint = new THREE.Vector3();
      geometry.faces.forEach((face,index)=>{
         let a = new THREE.Vector3().copy(geometry.vertices[face.a]);
         let b = new THREE.Vector3().copy(geometry.vertices[face.b]);
         let c = new THREE.Vector3().copy(geometry.vertices[face.c]);
         sliceGeo.vertices.push(a,b,c);
         let myFace = new THREE.Face3( sliceGeo.vertices.indexOf(a), sliceGeo.vertices.indexOf(b), sliceGeo.vertices.indexOf(c), new THREE.Vector3( 0, 0, 1 ),currentColor); 
         sliceGeo.faces.push(myFace);
         let middleLine = Math.round(sliceDivisions/2);
         if (step == middleLine){
            centerpoint = new THREE.Vector3();
            centerpoint.lerpVectors(a,b,0.66);
         }
         step++;
         if (step >= sliceDivisions) {
            step = 0;
            sliceGeo.mergeVertices();
            sliceGeo.computeVertexNormals();
            sliceGeo.computeFaceNormals();
            currentColor = randomThreeColor();
            material = new THREE.MeshBasicMaterial({
               color: currentColor,
               //polygonOffset: true,
               //polygonOffsetFactor: 1, 
               //polygonOffsetUnits: 1
            });
            let sliceMesh = new THREE.Mesh(sliceGeo, material);
            var geo = new THREE.WireframeGeometry( sliceMesh.geometry ); // or WireframeGeometry
            var mat = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 2 } );
            var wireframe = new THREE.LineSegments( geo, mat );
            sliceMesh.add(wireframe);
            middleGeo = new THREE.BoxGeometry(midsize,midsize,midsize);
            let midMesh = new THREE.Mesh(middleGeo,midMat);
            //middleGeo = new THREE.BoxGeometry(midsize,midsize,midsize);
            //sliceMesh.add(middleGeo);
            sliceMesh.add(midMesh);
            midMesh.position.copy(centerpoint);
            slices.add(sliceMesh);
            sliceGeo = new THREE.Geometry();
         }
      });
      this.el.setObject3D('menu', slices );
      geometry.dispose();
   }
});

AFRAME.registerSystem('fonts', {
   init: function () {
      this.getFont = this.getFont.bind(this);
      this.getText = this.getText.bind(this);
      var loader = new THREE.FontLoader();
      this.fonts = {
         ptsans: loader.parse(require('./../shared/fonts/pt_sans/pt_sans_regular.json')),
         fontawesome: loader.parse(require('./../shared/fonts/fontawesome/fontawesome-free.json'))
      };
      this.cache = {};
   }, 
   getFont: function (name) {
      if (this.fonts[name]){
         return this.fonts[name];
      } else {
         return null;
      }
   }, 
   getText: function (msg, config) {
      if (msg in this.cache){
         return this.cache[msg];
      } else {
         config.font = this.getFont(config.font);
         this.cache[msg] = new THREE.TextGeometry(config);
         return this.cache[msg];
      }
   }, 
});

AFRAME.registerComponent('awesome-icon', {
   schema:{ 
      icon: { type: 'string' , default:'' },
      color: {type: 'color', default: 'black'},
      size: {type: 'number', default: 1},
      resolution: {type: 'number', default: 2},
      offset: {type: 'vec3', default: {x: 0, y:0, z:0}},
      orient: {type: 'vec3', default: {x: 0, y:0, z:0}},
   },
   multiple: true,
   init: function () {
      this.setIcon=this.setIcon.bind(this);
      let data = this.data;
      this.defaultMaterial = new THREE.MeshBasicMaterial({
         color: data.color,
      });
      this.material = null;
   }, 
   update: function(){
      this.setIcon();
   },
   setIcon: function() {
         font = this.el.sceneEl.systems.fonts.getFont('fontawesome');
         let data = this.data;
         if (this.el.object3DMap && this.el.object3DMap.icon && this.el.object3DMap.icon !== undefined) {
            this.el.removeObject3D('icon');
         }
         if (!this.el.components.material) {
            this.defaultMaterial.setValues({
               color: data.color
            });
            this.material = this.defaultMaterial;
            this.material.needsUpdate = true;
         } else {
            this.material = this.el.components.material.material;
            this.material.needsUpdate = true;
         }
         let geometry = new THREE.TextGeometry(this.data.icon, {
            font: font,
            size: this.data.size * 0.1,
            height: 0,
            curveSegments: data.resolution,
            bevelEnabled: false,
         });
         geometry.computeBoundingBox();
         let box = geometry.boundingBox;
         let extents = new THREE.Vector3();
         box.getSize(extents);
         extents.multiplyScalar(0.5);
         let mesh = new THREE.Mesh(geometry, this.material);
         let group = new THREE.Group();
         group.add(mesh);
         mesh.position.sub(extents);
         mesh.position.add(this.data.offset);
         mesh.rotation.setFromVector3(this.data.orient);
         this.el.setObject3D('icon', group);
      //console.log(mesh);
   },
   remove: function(){
      if ( this.defaultMaterial && this.defaultMaterial.dipose) this.defaultMaterial.dispose();
      this.el.removeObject3D('icon');
   }
});

AFRAME.registerSystem('player', {
   init: function () {
      this.el.player = this;
      this.subscribe=this.subscribe.bind(this);
      this.remove = this.remove.bind(this);
      this.head=null;
      this.shoulders = null;
      this.body = null;
      this.motionControllers = {
         left: null,
         right: null,
      };
   }, 
   subscribe: function(name, component){
      switch(name) {
         case 'body':
            this.body = component;
            break;
         case 'head':
            this.head = component;
            AFRAME.utils.entity.setComponentProperty(component.el,'camera', {active: true});
            break;
         case 'motion-controller':
            let hand = component.data.hand;
            this.motionControllers[hand] = component;
           // AFRAME.utils.entity.setComponentProperty(el,'camera', {active: true});
            break;
         default:
            if (component.data.hand) {
               if (!this[name]) this[name] = {};
               this[name][component.data.hand] = component;
            } else {
               this[name] = component;
            }
      }
   },
   remove: function(el){
      //el.removeAttribute('raycaster');
      //el.removeAttribute('line');
      //el.removeAttribute('tracked-controls');
      //el.removeAttribute('motion-controller');
      //el.parentElement.removeChild(el);
      el.destroy();
      el.parentElement.removeChild(el);
   }
});
AFRAME.registerComponent('head', {
   init: function () {
      this.system = this.el.sceneEl.systems.player;
      new ComponentMixin.Events(this);
      this.system.subscribe('head', this);
   }, 
});
AFRAME.registerComponent('player', {
   init: function () {
      if (!this.el.sceneEl.systems.player) throw new Error(`Player system not found`);
      this.system = this.el.sceneEl.systems.player;
      this.system.subscribe('body', this);
   }, 
});
AFRAME.registerComponent('shoulders', {
   schema: {head:{
      type: 'selector',
      default: '#vr-camera'
   }},
   dependencies: [],
   init: function () {
      if (!this.el.sceneEl.systems.player) throw new Error(`Player system not found`);
      this.system = this.el.sceneEl.systems.player;
      this.system.subscribe('shoulders',this);
      this.axis = new THREE.Vector3(0,1,0);
   }, 
   tick: function(){
      if (!this.data.head) return;
      this.el.object3D.rotateOnAxis(this.axis,this.data.head.object3D.rotation.y);
      this.el.object3D.position.copy(this.data.head.object3D.position).multiply({x:0,y:0.5,z:0});
   }
});
AFRAME.registerComponent('motion-controller', {
   dependencies:['position','rotation','scale','tracked-controls'],
   schema:{
      hand: {
         type: 'string' ,
         default:'left'
      },
   },
   multiple: false,
   init: function () {
      if (!this.el.sceneEl.systems.player) throw new Error(`Player system not found`);
      this.system = this.el.sceneEl.systems.player;
      this.system.subscribe('motion-controller', this);
   }, 
});


var ComponentMixin = {
   Listener : function(name, eventName, callbackfn, context) {
      this.name = name;
      this.eventName = eventName;
      this.callbackfn = callbackfn;
      this.paused = false;
      //this.once = false;
      this.id = AFRAME.utils.shortID ();
      this.remove=null;
      if (context) this.callbackfn = this.callbackfn.bind(context);
      this.run = function(e){
         if (this.paused==true){
            return false;
         } else {
            this.callbackfn(e);
            if (this.remove!==null) {
               this.remove();
            }
         }
      };
      this.run = this.run.bind(this);
      this.suspend = function() {
         if (this.paused == false) this.paused = true;
      };
      this.suspend = this.suspend.bind(this);
      this.resume = function() {
         if (this.paused == true) this.paused = false;
      };
      this.resume = this.resume.bind(this);
   },
   Events: function(component){
      let step, keys, length;
      component.registeredListenerMap = [];
      //component.registeredListeners = [];
      let index = 0;
      component.on = function(name, event, callbackfn, context) {
         component.registeredListenerMap[name]  = new ComponentMixin.Listener(name, event, callbackfn, context);
         component.el.addEventListener(component.registeredListenerMap[name] .eventName, component.registeredListenerMap[name].run);
         return component;
      };
      component.on = component.on.bind(component);
      component.off = function(name) {  
         if (component.registeredListenerMap[name]) {
            component.el.removeEventListener(component.registeredListenerMap[name].eventName, component.registeredListenerMap[name].run);
            delete registeredListenerMap[name];
         }
         return component;
      };
      component.off = component.off.bind(component);
      component.once = function(name, event, callbackfn, context) {
         component.registeredListenerMap[name]  = new ComponentMixin.Listener(name, event, callbackfn, context);
         component.registeredListenerMap[name].once = true;
         component.el.addEventListener(component.registeredListenerMap[name].eventName, component.registeredListenerMap[name].run, {once: true});
         component.registeredListenerMap[name].remove = function(){
            component.off(component.registeredListenerMap[name].name);
         };
         return component;
      };
      component.once = component.once.bind(component);
      component.emit = function(msg,detail){
         component.el.emit(msg, detail);
      };
      component.emit =component.emit.bind(component);
      component.removeAllListeners = function() {
         keys = Object.keys(component.registeredListenerMap); 
         length = keys.length;
         for (step=0; step < length; step++){
            key = keys[step];
            component.off(key);
         }
         return component;
      };
      component.suspendListener = function(name) {
         component.registeredListenerMap[name].suspend();
      };
      component.resumeListener = function(name) {
         component.registeredListenerMap[name].resume();
      };
   },
   Object3D: function(component){
      if (component.onObject3D){
         component.onObject3D=component.onObject3D.bind(component);
         let o3dHandler = function({detail : { type }}){
            if (type){
            let item = component.el.object3DMap[type];
            component.onObject3D(type, item);
         }
         };
         if (component.el && component.el.object3DMap && component.el.object3DMap !==undefined) {
            let keys = Object.keys(component.el.object3DMap);
            let length = keys.length;
            let key, o3d;
            //step = 0;
            for (let step=0; step < length; step++) {
               key = keys[step];
               o3d = component.el.object3DMap[key];
               component.onObject3D(key,o3d);
            }
         }
         component.el.addEventListener('object3dset',o3dHandler);
      }
   }
};
ComponentMixin.Listener=ComponentMixin.Listener.bind(ComponentMixin.Listener);
if (!window.debug) window.debug = console.log;
