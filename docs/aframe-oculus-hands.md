# **Oculus Quest Hands**

![image](https://imgur.com/UQ2pqAd.gif =150x150)

A set of components meant to emulate the behavior and controls of the virtual hands as seen in the [First Steps](https://www.oculus.com/experiences/quest/1863547050392688) app for the [Oculus Quest](https://www.oculus.com/quest/).

These components enable the ability to pick up, move and drop virtual items with the Oculus Touch controllers. This module includes all the components necessary to enable this functionality. 

_These components should **not** be used in conjunction with other hand-control modules or components_, such as `hand-controls` or `super-hands` components. The prescribed model may, however, be modified to replace the default hand model for the `hand-controls` component.

The design file for the hand model can be found in [`./src/assets`](./src/assets). The model may be edited in [Autodesk Maya](https;//autodesk.com/maya) to add additional [gestures](#Gestures) or customize [alignment targets](#Alignments). Additional 3D editors such as Blender may be supported in the future. Please refrain from adding crude or insulting gestures to the model.


Support may eventually be added for [Oculus Hand Tracking](https://www.oculus.com/blog/introducing-hand-tracking-on-oculus-quest-bringing-your-real-hands-into-vr/?locale=en_US).

<hr>

## **oculus-quest-hands**

<hr>

A wrapper for [oculus-touch-controls](https://aframe.io/docs/master/components/oculus-touch-controls.html) that adds additional events, methods and a [prescribed hand model](./assets.md). This model supports a range of pre-animated poses and gestures to accommodate common gestures a user might make in VR.

Advanced users may consider replacing native grab and drop methods with their preferred grab controls. To use a custom grab or drop method, please use 
```js
AFRAME.utils.extendComponent('oculus-quest-hands', 'grab', (grabEvent) => {/*your custom grab code here*/});
```

The appearance can be modified with [A-Frame 'material' component](https://aframe.io/docs/master/components/material.html).

**Examples**

```html
<!--     with url(path/to/asset);    -->
<a-entity id="leftHand" 
	 oculus-quest-hands="model: url(./handLeft.glb); hand: left; camera: #vr-camera;"
	 material="color: blue;">
</a-entity>
```
```html
<!--     with asset-item   -->

<a-asset-item id="md-hand" src="path/to/handLeft.glb"></a-asset-item>

<a-entity id="leftHand" 
	 oculus-quest-hands="model: #md-hand hand: left; camera: #vr-camera;"
	 material="color: blue;">
</a-entity>
```

**Properties**

| Property | Property Type | Default Value |  Description  |
|---|---|---|---|
|  model | _asset_ |  `./handRight.glb` | The path to the prescribed hand model in glb format. |
|  hand | _string_  |  'right'  | The hand this entity represents. Can be one of 'right' or 'left' |
|  camera | _selector_  |  `null`  | The height of the rectangle. |
|  debug | _boolean_  |  `false`  | Show debug information and log all events to console. |

<hr>

### Gestures

Gestures are stored as animation targets in the [prescribed hand model](./assets.md). 

### Alignments

The presribed hand model includes a number of transforms which assist in aligning objects to different hand gestures when they are picked up. Which alignment a grabbed item aligns to may be configured with the ['grabbable' component](#grabbable).
