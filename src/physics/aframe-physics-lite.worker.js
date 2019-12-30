/*jshint esversion: 8*/
//const ComponentEmitter = require('component-emitter');
//const StateMachine = require('javascript-state-machine');
const OIMO = require('oimo');
var World = null;
var Bodies = new Map();
var emit = async function (evtName, detail) {
	self.postMessage({
		type: evtName,
		detail: detail
	});
};
var bodyDataToPage = new Map();
var pageBody = function () {
	this.position = {
		x: 0,
		y: 0,
		z: 0
	};
	this.quaternion = {
		x: 0,
		y: 0,
		z: 0,
		w: 0
	};
};
var currentBody;
var step = function () {
	World.step();
	Bodies.forEach((BODY, BODY_ID) => {
		if (!bodyDataToPage.has(BODY_ID)) {
			bodyDataToPage.set(BODY_ID, new pageBody());
		}
		currentBody = bodyDataToPage.get(BODY_ID);
		currentBody.position = BODY.getPosition();
		currentBody.quaternion = BODY.getQuaternion();
	});
	emit('post-step', {
		bodies: bodyDataToPage
	});
};
var data, detail;
self.onmessage = function (evt) {
	data = evt.data;
	detail = evt.data.detail;
	//console.log(data);
	switch (data.type) {
	case 'init':
		World = new OIMO.World(detail.WORLD_CONFIG);
		World.add({
			size: [50, 10, 50],
			pos: [0, -5, 0]
		});
		emit('physics-started', {
			msg: 'started'
		});
		//console.dir(World);
		break;
	case 'step':
		step(detail);
		break;
	case 'pause':
		World.stop();
		break;
	case 'add-body':
		Bodies.set(detail.BODY_ID, World.add(detail.BODY_CONFIG));
		break;
	case 'remove-body':
		var removedBody = Bodies.get(detail.BODY_ID);
		World.remove(removedBody);
		break;
	case 'update-body':
		break;
	}
};