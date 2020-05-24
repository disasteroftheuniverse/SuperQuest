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
	init: function () {
		this.tick = AFRAME.utils.throttleTick(this.tick, 10, this);

		//var dumpIntoConsole = function () {
      this.el.addState('regulated');
		//};
	},
	tick: function () {
		if (this.el.is('regulated')) {
			this.el.object3D.position.clamp(this.data.min, this.data.max);
		}
	}
});