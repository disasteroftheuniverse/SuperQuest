module.exports =AFRAME.registerComponent('billboard', {
	dependencies: ['rotation'],
	schema: {
		src: {
			type: 'selector',
			default: '#vr-camera'
		},
	},
	init: function () {
		//find the 
		this.lookAtTarget = new THREE.Vector3();
	},
	tick: function (t,dt) {
		if (this.el.object3DMap) {
			//get the world position of target
			this.data.src.object3D.getWorldPosition(this.lookAtTarget);

			//use native THREE look
			this.el.object3D.lookAt(this.lookAtTarget);

			//set rotation to 0 on other axes
			this.el.object3D.rotation.x = 0;
			this.el.object3D.rotation.z = 0;
		}
	}
});