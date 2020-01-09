module.exports =AFRAME.registerComponent('billboard', {
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
	},
	tick: function () {
		if (this.el.object3DMap) {
			this.data.src.object3D.getWorldPosition(this.lookAtTarget);
			this.el.object3D.lookAt(this.lookAtTarget);
			this.el.object3D.rotation.x = 0;
			this.el.object3D.rotation.z = 0;
		}
	}
});