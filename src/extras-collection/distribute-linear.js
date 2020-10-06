module.exports = {
	distribute_linear: AFRAME.registerComponent('distribute-linear', {
		schema: {},
		init: function () {
			//var self = this; var el = this.el;
			var children = this.el.children;
			this.childEls = Array.from(children);
			this.numChildren = this.childEls.length;
			this.childComponents = [];
			this.childCounter = 0;
			this.localPosition = new THREE.Vector3();
			for (var j = 0; j < this.childEls.length; j++) {
				var schema = {
					parent: this.el,
					offset: j,
					max: this.childEls.length,
					first: false,
					last: false
				};
				if (j == 0) {
					this.firstChild = this.childEls[j];
					schema.first = true;
					//console.log(this.childEls[j]);
				}
				if (j == this.childEls.length - 1) {
					this.lastChild = this.childEls[j];
					schema.last = true;
					// console.log(this.childEls[j]);
				}
				this.childEls[j].setAttribute('distribute', schema);
			}
		},
		subscribe: function (el, component) {
			this.childCounter++;
			this.childComponents.push(component);
			if (this.childCounter == this.numChildren) {
				this.updateChain();
			}
		},
		updateChain: function () {

			for (this.childCounter = 0; this.childCounter < this.numChildren; this.childCounter++) {
				this.localPosition.lerpVectors(this.firstChild.object3D.position, this.lastChild.object3D.position, this.childCounter / this.numChildren);
				this.childComponents[this.childCounter].updateAlignment(this.localPosition);
			}
		}
	}),
	distribute: AFRAME.registerComponent('distribute', {
		schema: {
			parent: {
				type: 'selector'
			},
			offset: {
				type: 'number'
			},
			max: {
				type: 'number'
			},
			first: {
				type: 'boolean',
				default: false
			},
			last: {
				type: 'boolean',
				default: false
			},
		},
		init: function () {
			this.manager = this.data.parent.components['distribute-linear'];
			this.data.parent.components['distribute-linear'].subscribe(this.el, this);
		},
		updateAlignment: function (v) {
			this.el.object3D.position.copy(v);
		}
	})
};