/*jshint esversion: 6*/
module.exports = AFRAME.registerComponent('clamp', {
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
	tick: function () {
		if (this.el.is('regulated')) {
			//restrict movement using THREE native 
			this.el.object3D.position.clamp(this.data.min, this.data.max);
		}
	}
});