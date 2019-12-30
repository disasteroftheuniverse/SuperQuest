# Components

[Home](./index)

## mixer-control

Adds a click listener to an element to set aframe-extras/mesh-mixer on a model

```html
<a-entity mixer-control="model: #model; clip: walkcycle"></a-entity>
```

| property | type | default  |  usage  |
|---|---|---|---|
|  model | selector |  `null` |  the model to set animations for |
|  clip | string  |  `*`  |  which clip to play on click  |

## layered-material

Creates two lambert materials and blends them based on an alpha derived from a canvas

## split-mesh

extracts sub-objects from models and attaches them to entities

```html
<a-entity id="gltf" gltf-model="assets/my-model.glb"></a-entity>
<a-entity split-mesh="model: #gltf; name: subModel; map: mesh"></a-entity>
```

| property | type | default  |  usage  |
|---|---|---|---|
|  model | selector |  `null` |  the model to split up |
|  name | string  |  `null`  |  the name of the sub-object, typically named in a 3d software like Blender |
|  map | string  |  `'mesh'`  |  optional - the name in ```<a-entity>.object3DMap``` |

## portal

requires `camera` component. renders view from another camera in scene to a texture

```html
<a-entity id="cctv" camera="fov: 120; active: false;" spectator="screen: #tv; fps: 25;"></a-entity>
<a-entity id="tv" geometry="primitive: plane;"></a-entity>
```

| property | type | default  |  usage  |
|---|---|---|---|
|  screen | selector |  `null` |  the entity to apply the screen to |
|  fps | number  |  `30.00`  |  the refresh rate of the screen texture. _Increasing this number impacts performance_ |

## aabb

a very simple collision detection system

```html
<a-entity id='cube' aabb="
    moves: true;
    enabled: true;
    autoRefresh: true;
    bounds: proxy;
    interval: 40;
    belongsTo: group1, group 3;
    collidesWith: group2;
    predict: true
"></a-entity>
```

| property | type | default  |  usage  |
|---|---|---|---|
|  enabled | boolean |  `true` |  whether the object is considered for collision by other objects |
|  autoRefresh | boolean |  `true` |  when object is moving, collision boundary is also updated |
|  size | vec3 |  `0.25 0.25 0.25` |  When bounds is 'box' or 'subproxy', sets the dimensions of the object in meters width x height x depth |
|  bounds | string |  `proxy` |  how the shape of the AABB is computed. supports `box`,`mesh`, `proxy` and `subproxy`|
|  offset | vec3 |  `0 0 0` |  move the aabb collider relative to local position |
|  interval | number |  `20` |  Number of miliseconds between collision checks. Low numbers are allow more accurate collision, higher numbers are more performant. |
|  belongsTo | array |  `none` |  The groups to which this AABB belongs. |
|  collidesWith | array |  `none` |  A list of groups to check for collision against. |
|  predict | boolean |  `true` |  Test for collisions a frame ahead for more precise collision detection. |
