### portal
requires `camera` component. renders view from another camera in scene to a texture
```html
<a-entity id="cctv" camera="fov: 120; active: false;" spectator="screen: #tv; fps: 25;"></a-entity>
<a-entity id="tv" geometry="primitive: plane;"></a-entity>
```
| property | type | default  |  usage  |   
|---|---|---|---|
|  screen | selector |  `null` |  the entity to apply the screen to |
|  fps | number  |  `30.00`  |  the refresh rate of the screen texture. <span style="color: red; background-color: yellow">Warning</span> Increasing this number impacts performance |

TODO: docs/ layers