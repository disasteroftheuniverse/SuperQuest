/*jshint esversion: 6*/

module.exports = {
	teleporter_system: AFRAME.registerSystem('teleporter-controls', {
		schema: {
			marker: {
				type: 'selector'  
			},
			markerRadius: {
				type: 'number',
				default: 0.33
			},
			markerHeight: {
				type: 'number',
				default: 0.25
			},
			markerDivisions: {
				type: 'number',
				default: 24
			},
			playerHeightOffset: {
				type: 'number',
				default: 1.5
			}
		},
		init: function () {
			this.components = [];
         this.subscribe = this.subscribe.bind(this);
         this.unsubscribe = this.unsubscribe.bind(this);
			this.marker = null;
		},
		subscribe: function (component) {
         if (this.components.length >= 2) {
            component.el.removeAttribute('teleporter-controls');
            return console.log('player may not have more than two arms');
         }
			this.components.push(component);
			var index = this.components.indexOf(component);
			component.locomoteID = index;
			var black = new THREE.Color(0x000000).convertSRGBToLinear();
			//console.log(this.data.marker);
			//console.log(this.marker);
			if (!this.data.marker && !this.marker) {
				this.marker = document.createElement('a-entity');
				this.marker.setAttribute('id', 'teleport-marker-' + AFRAME.utils.makeId(5));
				this.marker.classList.add('teleport-marker');
            this.el.appendChild(this.marker);
            
				var mesh = new THREE.Mesh(
					new THREE.CylinderBufferGeometry(this.data.markerRadius, this.data.markerRadius, this.data.markerHeight, this.data.markerDivisions, 1, true),
					AFRAME.utils.getGradientShader('teleportDestination', black, component.yesColor)
            );
            
				this.marker.setObject3D('mesh', mesh);
				mesh.updateMatrixWorld(true);
				this.marker.object3DMap.mesh.position.setY(this.data.markerHeight / 2);
				//AFRAME.utils.getGradientShader('teleportDestination', black, component.yesColor).setValues({});
				//AFRAME.utils.entity.onLoad(this.marker, this._createMarker, this);
			} else if (!this.marker && this.data.marker) {
				this.marker = this.data.marker;
         }
         
			if (this.components.length > 1) {
				this.hasTwoHands = true;
         }
         
			component.destObject = this.marker.object3D;
			component._create();
      },
      unsubscribe: function(component){
         let index = this.components.indexOf(component);
         this.components.splice(index,1);

         if (this.components.length < 2) {
            this.hasTwoHands = false;
         }
         
      },
      toggleOtherHand: function (component) {
			if (!this.hasTwoHands) return;
			this.otherHandIndex = (component.locomoteID == 1) ? 0 : 1;
			//this.components[this.otherHandIndex].hasDestination=null;
			this.components[this.otherHandIndex]._hideTeleportUI(true);
		}
	}),
	teleporter_controls: AFRAME.registerComponent('teleporter-controls', {
		dependencies: ['position', 'rotation', 'scale'],
		schema: {
			objects: {
				type: 'string',
				default: '.telepad'
			},
			startOn: {
				type: 'array',
				default: ['ybuttondown','bbuttondown','trackpaddown']
			},
			cancelOn: {
				type: 'array',
				default: ['ybuttonup','bbuttonup','trackpadup']
			},
			moveOn: {
				type: 'array',
				default: ['ybuttonup','bbuttonup','trackpadup']
			},
			player: {
				type: 'selector',
				default: '#vr-player'
			},
			camera: {
				type: 'selector',
				default: '#vr-camera'
			},
			length: {
				type: 'number',
				default: 4
			},
			yesColor: {
				type: 'color',
				default: '#8FE388'
			},
			noColor: {
				type: 'color',
				default: '#E7556A'
			},
			style: {
				type: 'string',
				default: 'tube',
				oneOf: ['tube', 'line']
			},
			enabled: {
				type: 'boolean',
				default: true
			},
			signal: {
				type: 'boolean',
				default: true
			}
		},
		init: function () {
			this.playerTeleportDestination = new THREE.Vector3();
			this.playerTeleportOffset = new THREE.Vector3();
			//this.orientDestHelperVec = new THREE.Vector3();
			this.orientDestNormalVec = new THREE.Vector3();
			this.orientDestQuat = new THREE.Quaternion();
			//this.noEulerHelper = new THREE.Euler(0,0,0);
			this.__startHandler = this.__startHandler.bind(this);
			this.__moveHandler = this.__moveHandler.bind(this);
         this.__cancelHandler = this.__cancelHandler.bind(this);

         this.registerListeners = this.registerListeners.bind(this);
         this.deregisterListeners = this.deregisterListeners.bind(this);
         //this.__cancelHandler = this.__cancelHandler.bind(this);
         
         this._hideTeleportUI = this._hideTeleportUI.bind(this);
         
			this._create = this._create.bind(this);
			this.rayOrigin = new THREE.Vector3(0, 0, 0);
			this.rayAim = new THREE.Vector3(0, -1, -0.5).normalize();
			this.yesColor = new THREE.Color(this.data.yesColor).convertSRGBToLinear();
			this.noColor = new THREE.Color(this.data.noColor).convertSRGBToLinear();
			this.__angleSolve.bind(this);
			this.offsetScalar = this.__angleSolve(this.rayAim.z, this.rayAim.y, this.data.length);
         this.seekTeleportDestination = this.seekTeleportDestination.bind(this);
         this.system.subscribe(this);
         
      },
      update: function(old){
         //console.log(this)

         console.log('teleport controls updated\n new:', this.data,'\nold: ');
         this.deregisterListeners();
         this.registerListeners();

         //console.log(this);

      },
      registerListeners: function () {
         if (!this.registeredListeners) {
            this.registeredListeners = {
               startOn: null,
               cancelOn: null,
               moveOn: null
            };
         }

         if (this.registeredListeners.startOn === null) {
            this.registeredListeners.startOn=[];
            this.data.startOn.forEach(eventName => {
               this.registeredListeners.startOn.push(eventName);
               this.el.addEventListener(eventName, this.__startHandler);
            }, this);
         }

         if (this.registeredListeners.cancelOn === null) {
            this.registeredListeners.cancelOn=[];
            this.data.cancelOn.forEach(eventName => {
               this.registeredListeners.cancelOn.push(eventName);
               this.el.addEventListener(eventName, this.__cancelHandler);
            }, this);
         }

         if (this.registeredListeners.moveOn === null) {
            this.registeredListeners.moveOn=[];
            this.data.moveOn.forEach(eventName => {
               this.registeredListeners.moveOn.push(eventName);
               this.el.addEventListener(eventName, this.__moveHandler);
            }, this);
         }


         



      },
      deregisterListeners: function(){
         if (!this.registeredListeners) return;

         if (this.registeredListeners.startOn !== null) {
            this.registeredListeners.startOn.forEach(eventName => {
               this.el.removeEventListener(eventName, this.__startHandler);
            }, this);
            this.registeredListeners.startOn = null;
         }

         if (this.registeredListeners.moveOn !== null) {
            this.registeredListeners.moveOn.forEach(eventName => {
               this.el.removeEventListener(eventName, this.__moveHandler);
            }, this);
            this.registeredListeners.moveOn = null;
         }

         if (this.registeredListeners.cancelOn !== null) {
            this.registeredListeners.cancelOn.forEach(eventName => {
               this.el.removeEventListener(eventName, this.__cancelHandler);
            }, this);
            this.registeredListeners.cancelOn = null;
         }

      },
		_create: function () {
			var el = this.el;
			var data = this.data;
			var locomote = this;
			locomote.rayOrigin = new THREE.Vector3(0, 0, 0);
			locomote.rayAim = new THREE.Vector3(0, -0.125, -0.5).normalize();
			this.beamEl = document.createElement('a-entity');
         this.el.appendChild(this.beamEl);
        //console.log('boop')
			this.beamEl.setAttribute('raycaster', {
				origin: locomote.rayOrigin,
				direction: locomote.rayAim,
				objects: data.objects,
				showLine: false,
				near: 0,
				far: data.length,
				autoRefresh: false,
				//interval: 8
         });
         
			locomote.raycaster = this.beamEl.components.raycaster;
			locomote.v0 = new THREE.Vector3(0, 0, 0);
			locomote.v1 = new THREE.Vector3(0, 0, -1.0);
			locomote.v2 = new THREE.Vector3(0, -1, -3);
			locomote.v3 = new THREE.Vector3(0, 0, 0);
			var curve = new THREE.CubicBezierCurve3(
				locomote.v0, locomote.v3,
				locomote.v1,
				locomote.v2
			);
			switch (data.style) {
			case 'tube':
				locomote.curveGeometry = new THREE.TubeBufferGeometry(curve, 24, 0.0075, 2, false);
				locomote.lineMaterial = new THREE.MeshBasicMaterial({
					color: locomote.noColor,
					transparent: true,
					opacity: 0.6,
					//blending: THREE.AdditiveBlending,
					depthTest: true,
					depthWrite: false,
				});
				locomote.curveObject = new THREE.Mesh(locomote.curveGeometry, locomote.lineMaterial);
				locomote.refreshCurveGeo = function (v0, v1, v2) {
					locomote.v0.copy(v0);
					locomote.v3.copy(v0);
					locomote.v1.copy(v1);
					locomote.v2.copy(v2);
					locomote.curveObject.geometry.dispose();
					locomote.curveObject.geometry = new THREE.TubeBufferGeometry(curve, 24, 0.0075, 2, false);
				};
				break;
			case 'line':
			default:
				locomote.points = curve.getPoints(60);
				locomote.curveGeometry = new THREE.BufferGeometry().setFromPoints(locomote.points);
				locomote.lineMaterial = new THREE.LineBasicMaterial({
					color: locomote.noColor,
					transparent: true,
					opacity: 0.45,
					blending: THREE.AdditiveBlending
				});
				locomote.curveObject = new THREE.Line(locomote.curveGeometry, locomote.lineMaterial);
				locomote.refreshCurveGeo = function (v0, v1, v2) {
					locomote.v0.copy(v0);
					locomote.v1.copy(v1);
					locomote.v2.copy(v2);
					locomote.points = curve.getPoints(60);
					locomote.curveObject.geometry.setFromPoints(locomote.points);
				};
			}
			el.setObject3D('curve', locomote.curveObject);
			el.object3DMap.curve.updateMatrixWorld(true);

         AFRAME.utils
         .getGradientShader('teleportDestination')
         .setValues({
				depthTest: false,
				depthWrite: false,
				opacity: 0.65,
				transparent: true,
				side: THREE.DoubleSide,
				blending: THREE.AdditiveBlending
			});

			locomote.destObject.visible = false;
			locomote.curveObject.visible = false;
			//el.sceneEl.object3D.add(locomote.destObject);
			locomote.intersection = null;
			locomote.testEl = null;
			locomote.step = 0;
			locomote.destinationPoint = new THREE.Vector3();
			locomote.midpoint = new THREE.Vector3();
			locomote.startPoint = new THREE.Vector3();
			locomote.humpOffset = new THREE.Vector3(0, 0.01, 0);
		},
		__startHandler: function () {
        //console.log('ACTIVE')
			this.system.toggleOtherHand(this);
			this.beamEl.setAttribute('raycaster', {
				enabled: true
			});
			this.raycaster.refreshObjects();
			this.collisionObjects = Array.from(document.querySelectorAll(this.data.objects)); //this.raycaster.objects;//Array.from(document.querySelectorAll(this.data.objects));//this.raycaster.intersectedEls;
			this.numObjects = this.collisionObjects.length;
			if (this.data.signal == true) {
				//var l = this.collisionObjects.length;
				for (var i = 0; i < this.numObjects; i++) {
					this.collisionObjects[i].emit('teleportready', {
						el: this.el
					}, true);
				}
			}
			this.numObjects = this.collisionObjects.length;
			this.isTesting = true;
			this.lineMaterial.color = this.yesColor;
			this.lineMaterial.needsUpdate = true;
			this.curveObject.visible = true;
		},
		_hideTeleportUI: function (cancel) {
         //console.log('NOT ACTIVE')
			if (cancel && cancel == true) {
				this.hasDestination = null;
			}

			this.isTesting = null;

			this.beamEl.setAttribute('raycaster', {
				enabled: false
			});

			if (this.data.signal == true) {
				//var l = this.collisionObjects.length;
				for (var i = 0; i < this.numObjects; i++) {
					this.collisionObjects[i].emit('teleportcancel', {
						el: this.el
					}, true);
				}
			}
         
			this.curveObject.visible = false;
			this.destObject.visible = false;
		},
		__cancelHandler: function () {
			this._hideTeleportUI( (AFRAME.utils.deepEqual(this.data.moveOn, this.data.cancelOn))? false : true);
		},
		__moveHandler: function () {
        console.log('MOVE ACTIVE');
			if (this.hasDestination) {
				this.playerTeleportOffset.copy(this.data.camera.object3D.position);
           //console.log('boop')
				this.playerTeleportDestination.sub(this.playerTeleportOffset);

				this.playerTeleportDestination.setY(this.playerTeleportDestination.y + this.system.data.playerHeightOffset);

				this.data.player.object3D.parent.worldToLocal(this.playerTeleportDestination);
				this.data.player.object3D.position.copy(this.playerTeleportDestination);

				this.raycaster.refreshObjects();
				this.seekTeleportDestination();
				if (this.data.signal == true) {
					for (var i = 0; i < this.numObjects; i++) {
						this.collisionObjects[i].emit('teleported', {
							el: this.el
						}, true);
					}
				}
			}
		},
		__angleSolve: function (a, b, dist) {
			return Number(Math.sqrt((Math.pow(dist, 2)) / ((Math.pow(a, 2)) + (Math.pow(b, 2)))));
		},
		seekTeleportDestination: function () {
			this.intersection = this.raycaster.getIntersection(this.testEl);
			for (this.step = 0; this.step < this.numObjects; this.step++) {
				this.testEl = this.collisionObjects[this.step];
				this.intersection = this.raycaster.getIntersection(this.testEl);
				if (this.intersection) {

					this.playerTeleportDestination.copy(this.intersection.point);
					this.hasDestination = true;
               this.el.object3D.getWorldPosition(this.startPoint);
               
					this.destObject.position.copy(this.intersection.point);
               this.orientDestNormalVec.copy(this.intersection.face.normal);
               
               AFRAME.utils.math.setDirection(this.orientDestNormalVec, this.orientDestQuat);
               
					this.destObject.quaternion.copy(this.orientDestQuat);
					this.destinationPoint.copy(this.intersection.point);
					this.midpoint.lerpVectors(this.startPoint, this.intersection.point, 0.5);
					this.humpOffset.setY(this.intersection.distance / 5);
					this.midpoint.add(this.humpOffset);
					this.refreshCurveGeo(this.v0,
						this.el.object3DMap.curve.worldToLocal(this.midpoint),
						this.el.object3DMap.curve.worldToLocal(this.destinationPoint)
					);
					this.destObject.visible = true;
					this.lineMaterial.color = this.yesColor;
				} else {
					this.hasDestination = null;
					this.destObject.visible = false;
					this.lineMaterial.color = this.noColor;
					this.destinationPoint.set(0, this.rayAim.y * this.offsetScalar , Number(this.data.length*-1)); //Number(this.data.length*-1)); /*this.offsetScalar*/
					this.midpoint.lerpVectors(this.v0, this.destinationPoint, 0.5);
					this.humpOffset.setY(this.data.length / 4);
					this.midpoint.add(this.humpOffset);
					this.refreshCurveGeo(this.v0,
						this.midpoint,
						this.destinationPoint
					);
				}
			}
		},
		tick: function () {
         if (!this.isTesting) return;
        //console.log('boop')
			this.seekTeleportDestination();
      }, 
      remove: function(){
         this.deregisterListeners();
         if (this.el && this.el.object3DMap && this.el.object3DMap.curve) {
            this.el.removeObject3D('curve');
         }
         
         if (this.beamEl){
            this.beamEl.removeAttribute('raycaster');
            this.el.removeChild(this.beamEl);
            this.beamEl.dispose();
         }

         this.system.unsubscribe(this);

      },
	}),
	locomote: AFRAME.registerComponent('locomote', {
		schema: {
			camera: {
				type: 'string' ,
				default:'#vr-camera'
			},
			player: {
				type: 'selector' ,
				default:'#vr-player'
			},
		},
		init: function () {
			var data = this.data;
			//this.el.setAttribute('gamepad-controls',{debug: true, enabled: true, camera: data.camera});
			this.el.addEventListener('axismove',
			(e)=>{
				//e.detail.axis;
				//console.log(e.detail.axis);
				//data.camera

			});
		},

	}),
	
};


//SuperQuestTeleport;