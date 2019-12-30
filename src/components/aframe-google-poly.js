/*jshint esversion: 8*/
//var SuperQuestGooglePoly = {};
module.exports = {
	system: AFRAME.registerSystem('google-poly', {
		schema: {
			type: 'string',
		},
		__getAsset: function (id, el) {
			if (THREE.Cache.get(id) == undefined) {
				this.__loadAsset(id, el);
			} else {
				var file = THREE.Cache.get(id);
				this._create(file, el, id);
			}
		},
		_create: function (object, el) {
			object.updateMatrixWorld(true);
			var size = new THREE.Vector3();
			var centerpiv = new THREE.Vector3();
			var boxLocal = new THREE.Box3().setFromObject(object);
			boxLocal.getSize(size);
			var largest = Math.max.apply(Math, [size.x, size.y, size.z]);
			object.scale.multiplyScalar(1 / largest);
			object.scale.multiplyScalar(el.components.poly.data.size);
			boxLocal.setFromObject(object);
			boxLocal.getCenter(centerpiv);
			object.position.sub(centerpiv);
			var container = new THREE.Object3D();
			container.add(object);
			el.setObject3D('mesh', container);
		},
		__loadAsset: function (id, el) {
			const API_KEY = this.data;
			var self = this;
			var url = `https://poly.googleapis.com/v1/assets/${id}/?key=${API_KEY}`;
			var request = new XMLHttpRequest();
			request.open('GET', url, true);
			request.addEventListener('load', function (event) {
				var asset = JSON.parse(event.target.response);
				var model3d = function (modelType) {
					var polyAsset = asset.formats.find(format => {
						return format.formatType === modelType;
					});
					return polyAsset;
				};
				var loadOBJ = function (format) {
					var obj = format.root;
					var mtl = format.resources.find(resource => {
						return resource.url.endsWith('mtl');
					});
					var path = obj.url.slice(0, obj.url.indexOf(obj.relativePath));
					var loader = new THREE.MTLLoader();
					loader.setCrossOrigin(true);
					loader.setMaterialOptions({
						ignoreZeroRGBs: true
					});
					loader.setTexturePath(path);
					loader.load(mtl.url, function (materials) {
						var loader = new THREE.OBJLoader();
						loader.setMaterials(materials);
						loader.load(obj.url, function (object) {
							THREE.Cache.add(id, object);
							self._create(object, el, id);
						});
					});
				};
				var loadGLTF = function (format) {
					var obj = format.root;
					var loader = new THREE.GLTFLoader();
					loader.setCrossOrigin(true);
					loader.load(obj.url,
						function (gltf) {
							//console.log(THREE.Cache);
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
			THREE.Cache.enabled = true;
			//console.log(THREE.Cache.files);
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