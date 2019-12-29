
### AABB
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
|  group | array |  `string` |  The groups to which this AABB belongs. |
|  collidesWith | array |  `none` |  A list of groups to check for collision against. |


## grab-controls: TODO
## grab-controls: TODO