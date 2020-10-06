/*jshint esversion: 6*/

module.exports = {
	/*not ready yet*/
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
					//console.log(xml);
				}
			);
		}
	}),
	jsonmodel: AFRAME.registerComponent('json-model', {
		schema: {
			type: 'asset'
		},
		init: function () {
         var self = this;

         
         
         var loader = new THREE.ObjectLoader();
         //loader.setCrossOrigin('anonymous');
			loader.load(this.data, (obj) => {
            console.log(obj);
				self.el.setObject3D('mesh', obj);
				self.el.object3DMap.mesh.updateMatrixWorld(true);
			});
		},
		remove: function () {
			this.el.removeObject3D('mesh');
		}
	})
};