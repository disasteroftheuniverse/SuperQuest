/*jshint esversion: 6*/

module.exports = {
	clickable: AFRAME.registerComponent('clickable', {
		schema: {
			type: 'boolean',
			default: true
		},
		init: function () {
			this.el.classList.add('interactive');
		},
		update: function () {
			if (this.data == true) {
				this.el.classList.toggle('clickable', true);
				this.el.emit(
					'canclick', {
						detail: this.el
					},
					false
				);
			} else if (this.data == false) {
				this.el.classList.toggle('clickable', false);
				this.el.emit(
					'noclick', {
						detail: this.el
					},
					false
				);
			}
		}
	}),
	signal: AFRAME.registerComponent('signal', {
		schema: {
			on: {
				type: 'string',
				default: 'signal'
			},
			emit: {
				type: 'string',
				default: 'signal'
			},
			data: {
				type: 'string'
			},
			target: {
				type: 'selectorAll'
			},
			bubbles: {
				type: 'boolean',
				default: true
			}
		},
		multiple: true,
		__handleRegisteredEvents: function () {
			var detail = {};
			if (this.el.dataset && this.el.dataset[this.data.data]) {
				detail = AFRAME.utils.styleParser.parse(this.el.dataset[this.data.data]);
			}
			detail.srcEl = this.el;
			var j = this.__targets.length;
			for (var i = 0; i < j; i++) {
				this.__targets[i].emit(this.data.emit, detail, this.data.bubbles);
			}
		},
		__registerEventHandler: function (evtname) {
			this.el.addEventListener(evtname, this.__handleRegisteredEvents);
		},
		__deRegisterEventHandler: function (evtname) {
			this.el.removeEventListener(evtname, this.__handleRegisteredEvents);
		},
		init: function () {
			this.__targets = this.data.target; //Array.from(this.data.target);
			//console.log(this.__targets);
			this.__handleRegisteredEvents = this.__handleRegisteredEvents.bind(this);
			this.__registerEventHandler(this.data.on);
		},
		update: function (oldData) {
			if (oldData.on && this.data.on && oldData.on !== this.data.on) {
				this.__deRegisterEventHandler(oldData.on);
				this.__handleRegisteredEvents = this.__handleRegisteredEvents.bind(this);
				this.__registerEventHandler(this.data.on);
			}
			if (oldData.target && this.data.target && oldData.target !== this.data.target) {
				this.__targets = this.data.target;
			}
		},
		remove: function () {
			this.__deRegisterEventHandler();
		}
	}),
	signal_set: AFRAME.registerComponent('signal-set', {
		schema: {
			on: {
				type: 'string',
			},
			attr: {
				type: 'string'
			},
			target: {
				type: 'string',
				default: 'none'
			}
		},
		multiple: true,
		__handleRegisteredEvents: function () {
			var componentProperties;

			componentProperties = AFRAME.utils.entity.getComponentProperty(this.el, `set__${this.id}`);

			if (this.data.target !== 'none') {
				this._targets = Array.from(document.querySelectorAll(this.data.target));
			} else {
				this._targets = [this.el];
			}

			var j = this._targets.length;
			var _target;

			for (var i = 0; i < j; i++) {
				_target = this._targets[i];
				AFRAME.utils.entity.setComponentProperty(_target, this.data.attr, componentProperties);

			}
		},
		__registerEventHandler: function (evtname) {
			this.el.addEventListener(evtname, this.__handleRegisteredEvents);
		},
		__deRegisterEventHandler: function (evtname) {
			this.el.removeEventListener(evtname, this.__handleRegisteredEvents);
		},
		init: function () {


			if (!this.id) {
				console.error('Component id is required. Use signal-set__* to set an id.');
				return;
			}

			this._targets = [];
			this.__registerEventHandler = this.__registerEventHandler.bind(this);
			this.__handleRegisteredEvents = this.__handleRegisteredEvents.bind(this);
			this.__deRegisterEventHandler = this.__deRegisterEventHandler.bind(this);
			//this.update = this.update.bind(this);

			this.isSuspended = false;

		},
		play: function () {
			this.isSuspended = false;
		},
		pause: function () {
			this.isSuspended = true;
		},
		update: function (oldData) {

			if (!oldData.on && this.data.on) {
				this.__registerEventHandler(this.data.on);
			}

			if (oldData.on && this.data.on && oldData.on !== this.data.on) {
				this.__deRegisterEventHandler(oldData.on);
				this.__registerEventHandler(this.data.on);
			}

		},
		remove: function () {
			this.__deRegisterEventHandler();
		}
	}),
	attr_set: AFRAME.registerComponent('set', {
		schema: {
			type: 'string'
		},
		multiple: true,

		init: function () {
			if (!this.id) {
				console.error('Component id is required. Use attr-set__* to set an id.');
				return;
			}
			this.__data = AFRAME.utils.styleParser.parse(this.data);
		},
		getProperties: function () {
			return this;
		}

	}),
	signal_remove: AFRAME.registerComponent('signal-remove', {
		schema: {
			on: {
				type: 'string'
			},
			target: {
				type: 'selector'
			},
			attr: {
				type: 'string'
			}
		},
		init: function () {
			this.onPrescribedEvent = this.onPrescribedEvent.bind(this);
		},
		onPrescribedEvent: function () {
			this.data.target.removeAttribute(this.data.attr);
		},
		update: function (old) {
			if (!old.on) {
				this.el.addEventListener(this.data.on, this.onPrescribedEvent);
			} else {
				this.el.removeEventListener(old.on, this.onPrescribedEvent);
				this.el.addEventListener(this.data.on, this.onPrescribedEvent);
			}
		},
		remove: function () {
			this.el.removeEventListener(this.data.on, this.onPrescribedEvent);
			this.onPrescribedEvent = null;
		},
	})
};