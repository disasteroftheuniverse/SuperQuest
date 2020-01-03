/*jshint esversion: 8*/
//const ComponentEmitter = require('component-emitter');
const StateMachine = require('javascript-state-machine');
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
var bodyDataFromPage;
var pageBody = function () {
	this.is = 'dynamic';
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
var step = function (pageData) {
	bodyDataFromPage = pageData.pageBodies;


	World.step();

	bodyDataFromPage.forEach((BODY, BODY_ID) => {
		if (BODY.is === 'kinematic') {
			Bodies.get(BODY_ID).setQuaternion(BODY.quaternion);
			Bodies.get(BODY_ID).setPosition(BODY.position);
		} else if (BODY.is === 'dynamic') {
			currentBody = bodyDataToPage.get(BODY_ID);
			currentBody.position = Bodies.get(BODY_ID).getPosition();
			currentBody.quaternion = Bodies.get(BODY_ID).getQuaternion();
		}
	});
	emit('post-step', {
		bodies: bodyDataToPage
	});
};

var data, detail;
self.onmessage = function (evt) {
	var body;
	data = evt.data;
	detail = evt.data.detail;
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
			break;
		case 'step':
			step(detail);
			break;
		case 'pause':
			World.stop();
			break;
		case 'add-body':
			Bodies.set(detail.BODY_ID, World.add(detail.BODY_CONFIG));
			bodyDataToPage.set(detail.BODY_ID, detail.PAGE_BODY);
			break;
		case 'remove-body':

			var removedBody = Bodies.get(detail.BODY_ID);
			bodyDataToPage.delete(detail.BODY_ID);
			World.remove(removedBody);
			
			break;
		case 'update-body':
			//if detail.
			//Bodies.get(detail.BODY_ID);
			break;
		case 'kinemize-body':
			//if detail.
			body = Bodies.get(detail.BODY_ID); //.stateManager.kinemize();

			body.awake();
			body.isStatic = false;
			body.isKinematic = true;
			body.isDynamic = false;
			body.allowSleep = false;

			//Bodies.get(detail.BODY_ID).
			//bodyDataToPage.delete(detail.BODY_ID);
			break;
		case 'dynamize-body':
			body = Bodies.get(detail.BODY_ID); //.stateManager.dynamize();

			body.awake();
			body.allowSleep = true;

			body.isStatic = false;
			body.isKinematic = false;
			body.isDynamic = true;

			break;
	}
};