/*jshint esversion:6*/
module.exports = {
	rounded: AFRAME.registerComponent('rounded', {
		dependencies: ['position', 'rotation'],
		schema: {
			color: {
				type: 'color',
				default: 'black'
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
			var material = this.el.components.material;
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
	})};