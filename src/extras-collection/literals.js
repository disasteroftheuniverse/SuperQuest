/*jshint esversion: 8*/
var es6template = require('./../../node_modules/es6-template-strings');

module.exports = {
	template: AFRAME.registerComponent('template', {
		schema: {
			src: {
				type: 'selector'
			},
			classname: {
				type: 'string',
				default: 'none'
			},
			insert: {
				type: 'string',
				default: 'afterbegin',
				oneOf: ['afterbegin', 'beforebegin', 'beforeend', 'afterend']
			}
		},
		init: function () {
			this.purgeChildren = this.purgeChildren.bind(this);
			if (this.data.classname == 'none') {
				this.templateID = 'tmp-' + AFRAME.utils.makeId(5);
			} else {
				this.templateID = this.data.classname;
			}
		},
		purgeChildren: function () {
			var self = this;
			var children = Array.from(self.el.sceneEl.querySelectorAll(self.templateID));
			children.forEach((child) => {
				self.el.removeChild(child);
				child.destroy();
			});
		},
		update: function (old) {
			var self = this;
			var templateHTML = this.data.src;
			var dataset = this.el.dataset;
			var children = Array.from(templateHTML.content.children);
			children.forEach((child) => {
				child.classList.add(self.templateID);
			});
			if (old && old.src && old.src !== this.data.src) {
				this.purgeChildren();
			}
			var str = es6template(templateHTML.innerHTML, dataset);
			this.el.insertAdjacentHTML(this.data.insert, str);
		},
		remove: function () {
			this.purgeChildren();
		}
	}),
	template_file: AFRAME.registerComponent('template-file', {
		schema: {
			src: {
				type: 'asset'
			}
		},
		init: function () {
			var dataset = this.el.dataset;
			var src = this.data.src;
			var loader = new THREE.FileLoader();
			loader.load(src, (html) => {
				var str = es6template(html, dataset);
				console.log(str);
				this.el.insertAdjacentHTML('afterbegin', str);
			});
		}
	})
};