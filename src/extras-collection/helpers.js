/*jshint esversion: 8*/

module.exports = {
	axes_helper: AFRAME.registerComponent('axes-helper', {
		schema: { 
         scale: { type: 'vec3', default: { x: 1, y: 1, z: 1 } }, 
         pos: { type: 'vec3', default: { x: 0, y: 0, z: 0 } }, 
         rot: { type: 'vec3', default: { x: 0, y: 0, z: 0 } }, 
         child: { type: 'string', default: 'none' } },
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
};