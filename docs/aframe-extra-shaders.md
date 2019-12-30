# components

## portal

Requires `camera` component. Renders view from another camera in scene to a texture on another object.

### Example

```html
<a-entity id="cctv" camera="fov: 120; active: false;" spectator="screen: #tv; fps: 25;"></a-entity>
<a-entity id="tv" geometry="primitive: plane;"></a-entity>
```

### Component Properties

| property | type | default  |  usage  |
|---|---|---|---|
|  screen | selector |  `null` |  the entity to apply the screen to |
|  fps | number  |  `30.00`  |  the refresh rate of the screen texture. _Increasing this number impacts performance_ |
