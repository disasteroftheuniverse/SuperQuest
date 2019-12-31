/*jshint esversion: 6*/

var es6template = require('./../../node_modules/es6-template-strings');

module.exports = {
	rounded: AFRAME.registerComponent('rounded', {
		dependencies: ['position', 'rotation'],
		schema: {
			color: {
				type: 'color',
				default: 'white'
			},
			radius: {
				type: 'number',
				default: 0.1
			},
			width: {
				type: 'number',
				default: 1
			},
			height: {
				type: 'number',
				default: 1
			}
		},
		init: function () {
			var path = new THREE.Shape();
			this.savedColors = [];
			let material = this.el.components.material;
			/* jshint ignore:start */
			path.lineTo(0, this.data.height / 2),
			path.quadraticCurveTo(0, this.data.height / 2 + this.data.radius, this.data.radius, this.data.height / 2 + this.data.radius),
			path.lineTo(this.data.width + this.data.radius, this.data.height / 2 + this.data.radius),
			path.quadraticCurveTo(this.data.width + this.data.radius + this.data.radius, this.data.height / 2 + this.data.radius, this.data.width + this.data.radius + this.data.radius, this.data.height / 2),
			path.lineTo(this.data.width + this.data.radius + this.data.radius, (this.data.height / 2) * -1),
			path.quadraticCurveTo(this.data.width + this.data.radius + this.data.radius, -1 * (this.data.height / 2 + this.data.radius), this.data.width + this.data.radius, -1 * (this.data.height / 2 + this.data.radius)),
			path.lineTo(this.data.radius, -1 * (this.data.height / 2 + this.data.radius)),
			path.quadraticCurveTo(0, -1 * (this.data.height / 2 + this.data.radius), 0, (this.data.height / 2) * -1),
			path.lineTo(0, 0),
			path.closePath();
			/* jshint ignore:end */
			var pts = path.getPoints();
			pts.forEach.bind(this);
			pts.forEach((vec2) => {
				vec2.add({
					x: (this.data.width / 2 + this.data.radius) * -1,
					y: 0
				});
			});
			var geometry = new THREE.ShapeGeometry(new THREE.Shape(pts));
			geometry.verticesNeedUpdate = true;
			geometry.mergeVertices();
			geometry.verticesNeedUpdate = true;
			//this.roundedMaterial =
			if (!material) {
				material = {};
				material.material = new THREE.MeshBasicMaterial({
					color: new THREE.Color(this.data.color).convertSRGBToLinear()
				});
			}
			var mesh = new THREE.Mesh(geometry, material.material);
			this.resize = function (newWidth, newHeight) {
				var i;
				for (i = 1; i < 14; i++) {
					mesh.geometry.vertices[i].y = mesh.geometry.vertices[i].y + newHeight / 2;
					mesh.geometry.vertices[i].x = mesh.geometry.vertices[i].x - newWidth / 2;
				}
				for (i = 14; i < 27; i++) {
					mesh.geometry.vertices[i].y = mesh.geometry.vertices[i].y + newHeight / 2;
					mesh.geometry.vertices[i].x = mesh.geometry.vertices[i].x + newWidth / 2;
				}
				for (i = 27; i < 40; i++) {
					mesh.geometry.vertices[i].y = mesh.geometry.vertices[i].y - newHeight / 2;
					mesh.geometry.vertices[i].x = mesh.geometry.vertices[i].x + newWidth / 2;
				}
				for (i = 40; i < 53; i++) {
					mesh.geometry.vertices[i].y = mesh.geometry.vertices[i].y - newHeight / 2;
					mesh.geometry.vertices[i].x = mesh.geometry.vertices[i].x - newWidth / 2;
				}
				mesh.geometry.vertices[0].y = mesh.geometry.vertices[0].y - newHeight / 2;
				mesh.geometry.vertices[0].x = mesh.geometry.vertices[0].x - newWidth / 2;
				mesh.geometry.verticesNeedUpdate = true;
			};
			this.el.setObject3D('mesh', mesh);
		},
		update: function (prevData) {
			if (!prevData.width || !prevData.height || !prevData.color) return;
			//this.resize
			if (prevData.width !== this.data.width || prevData.height !== this.data.height) {
				this.resize(this.data.width - prevData.width, this.data.height - prevData.height);
			}
			//console.log(prevData);
			if (prevData.color !== this.data.color) {
				this.el.object3DMap.mesh.material.color = new THREE.Color(this.data.color).convertSRGBToLinear();
				this.el.object3DMap.mesh.material.needsUpdate = true;
			}
		}
	}),
	clamp: AFRAME.registerComponent('clamp', {
		dependencies: ['position'],
		schema: {
			min: {
				type: 'vec3',
				default: {
					x: -2,
					y: -1,
					z: -1
				}
			},
			max: {
				type: 'vec3',
				default: {
					x: 1,
					y: 1,
					z: 1
				}
			}
		},
		init: function () {
			this.tick = AFRAME.utils.throttleTick(this.tick, 10, this);
			const el = this.el,
				comp = this;
			var dumpIntoConsole = function () {
				el.addState('regulated');
			};
			AFRAME.utils.entity.onModel(el, dumpIntoConsole, comp);
		},
		tick: function () {
			if (this.el.is('regulated')) {
				this.el.object3D.position.clamp(this.data.min, this.data.max);
			}
		}
	}),
	log_object3D: AFRAME.registerComponent('log-object3d', {
		init: function () {
			AFRAME.utils.entity.onModel(this.el, this.log, this);
		},
		log: function () {
			console.log(this.el.object3D);
		}
	}),
	billboard: AFRAME.registerComponent('billboard', {
		dependencies: ['rotation'],
		schema: {
			src: {
				type: 'selector',
				default: '#vr-camera'
			}
		},
		init: function () {
			this.tick = AFRAME.utils.throttleTick(this.tick, 20, this);
			this.lookAtTarget = new THREE.Vector3();
			//AFRAME.utils.entity.onModel(el, dumpIntoConsole, comp);
		},
		tick: function () {
			if (this.el.object3DMap) {
				this.data.src.object3D.getWorldPosition(this.lookAtTarget);
				this.el.object3D.lookAt(this.lookAtTarget);
				this.el.object3D.rotation.x = 0;
				this.el.object3D.rotation.z = 0;
			}
		}
	}),
	check_devices:  AFRAME.registerComponent('check-devices', {
		dependencies: ['position'],
		schema: {},
		init: function () {
			//AFRAME.utils.device.hasControllers
		}
	}),
	clickable: AFRAME.registerComponent('clickable', {
		schema: {
			type: 'boolean',
			default: true
		},
		init: function () {
			this.el.classList.add('interactive');
		},
		update: function () {
			if (this.data == true) {
				this.el.classList.toggle('clickable', true);
				this.el.emit(
					'canclick', {
						detail: this.el
					},
					false
				);
			} else if (this.data == false) {
				this.el.classList.toggle('clickable', false);
				this.el.emit(
					'noclick', {
						detail: this.el
					},
					false
				);
			}
		}
	}),
	signal: AFRAME.registerComponent('signal', {
		schema: {
			on: {
				type: 'string',
				default: 'signal'
			},
			emit: {
				type: 'string',
				default: 'signal'
			},
			data: {
				type: 'string'
			},
			target: {
				type: 'selectorAll'
			},
			bubbles: {
				type: 'boolean',
				default: true
			}
		},
		multiple: true,
		__handleRegisteredEvents: function () {
			var detail = {};
			if (this.el.dataset && this.el.dataset[this.data.data]) {
				detail = AFRAME.utils.styleParser.parse(this.el.dataset[this.data.data]);
			}
			detail.srcEl = this.el;
			var j = this.__targets.length;
			for (var i = 0; i < j; i++) {
				this.__targets[i].emit(this.data.emit, detail, this.data.bubbles);
			}
		},
		__registerEventHandler: function (evtname) {
			this.el.addEventListener(evtname, this.__handleRegisteredEvents);
		},
		__deRegisterEventHandler: function (evtname) {
			this.el.removeEventListener(evtname, this.__handleRegisteredEvents);
		},
		init: function () {
			this.__targets = this.data.target; //Array.from(this.data.target);
			//console.log(this.__targets);
			this.__handleRegisteredEvents = this.__handleRegisteredEvents.bind(this);
			this.__registerEventHandler(this.data.on);
		},
		update: function (oldData) {
			if (oldData.on && this.data.on && oldData.on !== this.data.on) {
				this.__deRegisterEventHandler(oldData.on);
				this.__handleRegisteredEvents = this.__handleRegisteredEvents.bind(this);
				this.__registerEventHandler(this.data.on);
			}
			if (oldData.target && this.data.target && oldData.target !== this.data.target) {
				this.__targets = this.data.target;
			}
		},
		remove: function () {
			this.__deRegisterEventHandler();
		}
	}),
	signal_set: AFRAME.registerComponent('signal-set', {
		schema: {
			on: {
				type: 'string',
			},
			attr: {
				type: 'string'
			},
			target: {
				type: 'string',
				default: 'none'
			}
		},
		multiple: true,
		__handleRegisteredEvents: function () {
			var componentProperties;

			componentProperties = AFRAME.utils.entity.getComponentProperty(this.el,`set__${this.id}`);

			if (this.data.target !== 'none') {
				this._targets = Array.from(document.querySelectorAll(this.data.target));
			} else {
				this._targets = [this.el];
			}

			var j = this._targets.length;
			var _target;

			for (var i = 0; i < j; i++) {
				_target = this._targets[i];
				AFRAME.utils.entity.setComponentProperty(_target, this.data.attr, componentProperties);

			}
		},
		__registerEventHandler: function (evtname) {
			this.el.addEventListener(evtname, this.__handleRegisteredEvents);
		},
		__deRegisterEventHandler: function (evtname) {
			this.el.removeEventListener(evtname, this.__handleRegisteredEvents);
		},
		init: function () {


			if (!this.id) {
				console.error('Component id is required. Use signal-set__* to set an id.');
				return;
			}

			this._targets = [];
			this.__registerEventHandler = this.__registerEventHandler.bind(this);
			this.__handleRegisteredEvents = this.__handleRegisteredEvents.bind(this);
			this.__deRegisterEventHandler = this.__deRegisterEventHandler.bind(this);
			//this.update = this.update.bind(this);

			this.isSuspended = false;

		},
		play: function () {
			this.isSuspended = false;
		},
		pause: function () {
			this.isSuspended = true;
		},
		update: function (oldData) {

			if (!oldData.on && this.data.on) {
				this.__registerEventHandler(this.data.on);
			}

			if (oldData.on && this.data.on && oldData.on !== this.data.on) {
				this.__deRegisterEventHandler(oldData.on);
				this.__registerEventHandler(this.data.on);
			}

		},
		remove: function () {
			this.__deRegisterEventHandler();
		}
	}),
	attr_set: AFRAME.registerComponent('set', {

		multiple: true,

		init: function () {
			if (!this.id) {
				console.error('Component id is required. Use attr-set__* to set an id.');
				return;
			}
			this.__data = AFRAME.utils.styleParser.parse(this.data);
		},
		getProperties: function(){
			return this;
		}

	}),
	signal_remove: AFRAME.registerComponent('signal-remove', {
		schema: {
			on: {
				type: 'string'
			},
			target: {
				type: 'selector'
			},
			attr: {
				type: 'string'
			}
		},
		init: function () {
			this.onPrescribedEvent = this.onPrescribedEvent.bind(this);
		},
		onPrescribedEvent: function(){
			this.data.target.removeAttribute(this.data.attr);
		}, 
		update: function(old){
			if (!old.on){
				this.el.addEventListener(this.data.on, this.onPrescribedEvent);
			} else {
				this.el.removeEventListener(old.on, this.onPrescribedEvent);
				this.el.addEventListener(this.data.on, this.onPrescribedEvent);
			}
		},
		remove: function(){
			this.el.removeEventListener(this.data.on, this.onPrescribedEvent);
			this.onPrescribedEvent = null;
		},
	}),
	grid_floor: AFRAME.registerComponent('grid-floor', {
		init: function () {
			this.el.setObject3D('grid1', new THREE.GridHelper(10, 10));
			this.el.setObject3D('grid2', new THREE.GridHelper(10, 40));
			this.el.object3DMap.grid2.material.linewidth = 1;
			this.el.object3DMap.grid2.material.transparent = true;
			this.el.object3DMap.grid2.material.opacity = 0.22;
			this.el.object3DMap.grid2.material.needsUpdate = true;
		}
	}),
	template: AFRAME.registerComponent('template', {
		schema: {
			src: {
				type: 'selector'
			},
			classname: {
				type: 'string',
				default: 'none'
			},
			insert: {
				type: 'string',
				default: 'afterbegin',
				oneOf: ['afterbegin', 'beforebegin', 'beforeend', 'afterend']
			}
		},
		init: function () {
			this.purgeChildren = this.purgeChildren.bind(this);
			if (this.data.classname == 'none') {
				this.templateID = 'tmp-' + AFRAME.utils.makeId(5);
			} else {
				this.templateID = this.data.classname;
			}
		},
		purgeChildren: function () {
			var self = this;
			var children = Array.from(self.el.sceneEl.querySelectorAll(self.templateID));
			children.forEach((child) => {
				self.el.removeChild(child);
				child.destroy();
			});
		},
		update: function (old) {
			var self = this;
			var templateHTML = this.data.src;
			var dataset = this.el.dataset;
			var children = Array.from(templateHTML.content.children);
			children.forEach((child) => {
				child.classList.add(self.templateID);
			});
			if (old && old.src && old.src !== this.data.src) {
				this.purgeChildren();
			}
			var str = es6template(templateHTML.innerHTML, dataset);
			this.el.insertAdjacentHTML(this.data.insert, str);
		},
		remove: function () {
			this.purgeChildren();
		}
	}),
	template_file: AFRAME.registerComponent('template-file', {
		schema: {
			src: {
				type: 'asset'
			}
		},
		init: function () {
			var dataset = this.el.dataset;
			var src = this.data.src;
			var loader = new THREE.FileLoader();
			loader.load(src, (html) => {
				var str = es6template(html, dataset);
				console.log(str);
				this.el.insertAdjacentHTML('afterbegin', str);
			});
		}
	}),
	axes_helper: AFRAME.registerComponent('axes-helper', {
		schema: {
			scale: {
				type: 'vec3',
				default: {
					x: 1,
					y: 1,
					z: 1
				}
			},
			pos: {
				type: 'vec3',
				default: {
					x: 0,
					y: 0,
					z: 0
				}
			},
			rot: {
				type: 'vec3',
				default: {
					x: 0,
					y: 0,
					z: 0
				}
			},
			child: {
				type: 'string',
				default: 'none'
			}
		},
		multiple: true,
		init: function () {
			var group = AFRAME.utils.axishelper();
			group.scale.copy(this.data.scale);
			this.el.object3D.add(group);
		}
	}),
	wire_display: AFRAME.registerComponent('wire-display', {
		schema: {
			color: {
				type: 'color',
				default: 'yellow'
			},
			opacity: {
				type: 'number',
				default: 0.5
			}
		},
		create: function () {
			var self = this;
			var buffs = [];
			var geos = [];
			self.el.object3D.traverse((node) => {
				if (node.isBufferGeometry) {
					buffs.push(node);
				} else if (node.isGeometry) {
					geos.push(node);
				}
			});
			buffs.forEach((bufferGeo) => {
				//var buffgeo = new THREE.BufferGeometry().
				var edges = new THREE.EdgesGeometry(bufferGeo.clone());
				var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
					color: 0xffffff
				}));
				self.el.object3D.add(line);
				//
			});
			self.el.removeObject3D('mesh');
		},
		tick: function () {
			if (this.el.object3DMap.mesh && !this.pollingForMesh) {
				this.pollingForMesh = true;
				this.create();
			}
		}
	}),
	distribute_linear: AFRAME.registerComponent('distribute-linear', {
		schema: {},
		init: function () {
			//var self = this; var el = this.el;
			var children = this.el.children;
			this.childEls = Array.from(children);
			this.numChildren = this.childEls.length;
			this.childComponents = [];
			this.childCounter = 0;
			this.localPosition = new THREE.Vector3();
			for (var j = 0; j < this.childEls.length; j++) {
				var schema = {
					parent: this.el,
					offset: j,
					max: this.childEls.length,
					first: false,
					last: false
				};
				if (j == 0) {
					this.firstChild = this.childEls[j];
					schema.first = true;
					//console.log(this.childEls[j]);
				}
				if (j == this.childEls.length - 1) {
					this.lastChild = this.childEls[j];
					schema.last = true;
					// console.log(this.childEls[j]);
				}
				this.childEls[j].setAttribute('distribute', schema);
			}
		},
		subscribe: function (el, component) {
			this.childCounter++;
			this.childComponents.push(component);
			if (this.childCounter == this.numChildren) {
				this.updateChain();
			}
		},
		updateChain: function () {
			//this.childCounter=0;
			//var m = new THREE.Vector3()
			for (this.childCounter = 0; this.childCounter < this.numChildren; this.childCounter++) {
				this.localPosition.lerpVectors(this.firstChild.object3D.position, this.lastChild.object3D.position, this.childCounter / this.numChildren);
				//console.log(this.localPosition);
				this.childComponents[this.childCounter].updateAlignment(this.localPosition);
			}
		}
	}),
	distribute: AFRAME.registerComponent('distribute', {
		schema: {
			parent: {
				type: 'selector'
			},
			offset: {
				type: 'number'
			},
			max: {
				type: 'number'
			},
			first: {
				type: 'boolean',
				default: false
			},
			last: {
				type: 'boolean',
				default: false
			},
		},
		init: function () {
			this.manager = this.data.parent.components['distribute-linear'];
			this.data.parent.components['distribute-linear'].subscribe(this.el, this);
		},
		updateAlignment: function (v) {
			this.el.object3D.position.copy(v);
		}
	}),
	json_model: AFRAME.registerComponent('json-model', {
		schema: {
			type: 'asset'
		},
		init: function () {
			var self = this;
			var loader = new THREE.ObjectLoader();
			loader.load(this.data, (obj) => {
				self.el.setObject3D('mesh', obj);
				self.el.object3DMap.mesh.updateMatrixWorld(true);
			});
		},
		remove: function () {
			this.el.removeObject3D('mesh');
		}
	}),
	xml_template: AFRAME.registerComponent('xml-template', {
		schema: {
			type: 'asset'
		},
		init: function () {
			var self = this;
			//var data = this.data;
			self.loader = new THREE.FileLoader();
			self.loader.load(
				self.data,
				(xml) => {
					console.log(xml);
				}
			);
		}
	})
};
