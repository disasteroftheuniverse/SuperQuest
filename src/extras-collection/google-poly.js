/*jshint esversion: 8*/

module.exports = {
	system: AFRAME.registerSystem('google-poly', {
		schema: {
			type: 'string',
		},
		__getAsset: function (id, el) {
			/*
				check to see if we already 
				downloaded this mesh before
			*/
			if (THREE.Cache.get(id) == undefined) {
				this.__loadAsset(id, el);
			} else {
				var file = THREE.Cache.get(id);
				this._create(file, el, id);
			}
		},
		_create: function (object, el) {

			//ensure that the transformation matrices are current
			object.updateMatrixWorld(true);

			//create helpers
			var size = new THREE.Vector3();
			var centerpiv = new THREE.Vector3();
			var boxLocal = new THREE.Box3().setFromObject(object);
			

			/*
				normalize the size of the mesh to 
			 	the largest dimension in the bounding box 
				(google poly models have terrible scaling defaults)
				 
			*/
			
			boxLocal.getSize(size);
			var largest = Math.max.apply(Math, [size.x, size.y, size.z]);
			object.scale.multiplyScalar(1 / largest);
			object.scale.multiplyScalar(el.components.poly.data.size);

			/*
				center the new mesh at [0,0,0]
			*/
			boxLocal.setFromObject(object);
			boxLocal.getCenter(centerpiv);
			object.position.sub(centerpiv);

			/* 
				group under a new Object3D to 'freeze transforms'
			*/
			var container = new THREE.Object3D();
			container.add(object);

			/*
				add to scene
			*/
			el.setObject3D('mesh', container);
		},
		__loadAsset: function (id, el) {

			/*
				use google poly API Key 
			*/
			const API_KEY = this.data;
			var self = this; //blah, fix this
			var url = `https://poly.googleapis.com/v1/assets/${id}/?key=${API_KEY}`;

			/*create request*/
			var request = new XMLHttpRequest();
			request.open('GET', url, true);

			/* on request loaded ....*/
			request.addEventListener('load', function (event) {

				var asset = JSON.parse(event.target.response);

				/*determine what format the mesh is in to use the appropriate loader*/
				var model3d = function (modelType) {
					var polyAsset = asset.formats.find(format => {
						return format.formatType === modelType;
					});
					return polyAsset;
				};

				/*load Wavefront OBJ format models*/
				var loadOBJ = function (format) {
					var obj = format.root;

					/*
						use the [frankly, disgusting] 
						MTL file included. 
						It's 2020, stop using OBJ!

					*/
					var mtl = format.resources.find(resource => {
						return resource.url.endsWith('mtl');
					});

					var path = obj.url.slice(0, obj.url.indexOf(obj.relativePath));

					//still disgusted
					var loader = new THREE.MTLLoader();

					loader.setCrossOrigin(true);
					loader.setMaterialOptions({
						ignoreZeroRGBs: true
					});

					loader.setTexturePath(path);

					/*load and cache OBJ*/
					loader.load(mtl.url, function (materials) {
						var loader = new THREE.OBJLoader();
						loader.setMaterials(materials);
						loader.load(obj.url, function (object) {
							THREE.Cache.add(id, object);
							self._create(object, el, id);
						});
					});

				};

				/*loader for GLTF models*/
				var loadGLTF = function (format) {
					var obj = format.root;
					var loader = new THREE.GLTFLoader();
					loader.setCrossOrigin(true); //
					loader.load(obj.url,
						function (gltf) {
							THREE.Cache.add(id, gltf.scene);
							self._create(gltf.scene, el, id);
						},
						function (xhr) {
							console.log((xhr.loaded / xhr.total * 100) + '% loaded');
						},
						function (error) {
							console.error(error);
						}
					);
				};

				/*
					prioritize model download by format
				*/
				if (model3d('GLTF2') == undefined) {
					console.warn('Cannot load model as GLTF. Attempting to load OBJ');
					if (model3d('OBJ') == undefined) {
						console.error('Only GLTF and OBJ are supported at this time');
					} else {
						var gpolyasset = model3d('OBJ');
						loadOBJ(gpolyasset);
					}
				} else {
					var assetpolyg = model3d('GLTF2');
					loadGLTF(assetpolyg);
				}

			});
			request.send(null);
		},
		init: function () {
			/*I am too scared of collisions*/
			THREE.Cache.enabled = true;
			this.__getAsset = this.__getAsset.bind(this);
			this.__loadAsset = this.__loadAsset.bind(this);
			this._create = this._create.bind(this);

		}
	}),
	component: AFRAME.registerComponent('poly', {
		schema: {
			src: {
				type: 'string',
				default: '5vbJ5vildOq'
			},
			size: {
				type: 'number',
				default: 1
			}
		},
		init: function () {
			var el = this.el,
				data = this.data;
			this.system = this.el.sceneEl.systems['google-poly'];
			//var system = this.system;
			this.system.__getAsset(data.src, el);
		}
	}),
	primitive: AFRAME.registerPrimitive('a-poly', {
		defaultComponents: {
			'position': {
				x: 0,
				y: 0,
				z: 0
			},
			'scale': {
				x: 1,
				y: 1,
				z: 1
			},
			'poly': {
				size: 1,
				align: 'center'
			},
			//align:
		},
		mappings: {
			'src': 'poly.src',
			'size': 'poly.size',
		}
	})
};

//;
//SuperQuestGooglePoly.polycomponent = ;
//SuperQuestGooglePoly.polywrapper = ;
// SuperQuestGooglePoly;