module.exports = AFRAME.registerComponent('oculus-quest-haptics', {
   schema: {
      startOn: {
         type: 'string',
         default: 'poke'
      },
      dur: {
         type: 'number',
         default: 100
      },
      intensity: {
         type: 'number',
         default: 0.5
      }
   },
   multiple: true,
   rumble: function (e) {
		/*
		if (!this.gamepad){
			if (this.el.components['tracked-controls-webxr'] && this.el.components['tracked-controls-webxr'].controller) {
				this.controller = this.el.components['tracked-controls-webxr'].controller;
				this.gamepad = this.controller.gamepad;
			}
		}

		if (this.gamepad && !this.hapticActuators){
			this.hapticActuators = this.gamepad.hapticActuators;
		}

		console.log(this.gamepad);
		console.log(this.hapticActuators);

		try {
			this.hapticActuators[0].pulse(0.5,400);
		} catch (erp){
			console.log(erp);
		}*/
		var gamepads = navigator.getGamepads();
		for (var i=0; i<gamepads.length;i++){
			var gamepad = gamepads[i];
			if (gamepad){
				console.log(gamepad);

				if ('hapticActuators' in gamepad && gamepad.hapticActuators.length >0){
					gamepad.hapticActuators.pulse(0.9,500);
				}
			}
		}




   },
   init: function () {
		this.rumble = this.rumble.bind(this);

		this.el.addEventListener(this.data.startOn,this.rumble);

	},
	onUserInput: function(){

	},
	addRegisteredEventHandler: function(){
		//console.log(this.el.components['tracked-controls']);
	},
	onConnect: function(e){
		console.log(e);
	},
   update: function () {},
   remove: function () {
      //this.el.removeEventListener(this.data.startOn, this.rumble);
   }
});