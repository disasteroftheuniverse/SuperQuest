## Body Component

Creates a rigid body for an entity

```html
<a-entity
    body="friction: 0.2; 
          restitution: 0.3;
          move: true;
          density: 2;
          belongsTo: 1;
          collidesWith: 1;"          
></a-entity>

```

| Property | Property Type | Default Value |  Description  |
|---|---|---|---|
|  friction | _number_ |  0.2|  friction coefficient. 0 = no friction, 1 = all the friction |
|  restitution | _number_  |  0.3  | The bouciness of the object. 0 = not bouncy, 1 = very bouncy|
|  density | _number_  |  1  | The mass of the object |
|  belongsTo | _number_  |  0  | Bit mask to which this object belongs |
|  collidesWith | _number_  |  0  | Bit mask of objects which this object may test for collision. |
|  move | _boolean_  |  1  | Body is dynamic if true, kinematic if false. |

## Shape Component

Enables custom collision boundaries and properties. Multiple shapes may be added for compound colliders for more complex collisions. Must be added after the body component.

```html
<a-entity body shape__cylinder="type: cylinder; size: 1 1 0; debug: false; offset: 0 0.1 0"></a-entity>
```

| Property | Property Type | Default Value |  Description  |
|---|---|---|---|
|  type | _string_ |  box|  Collider shape may be one of Box, Cylinder or Sphere |
|  size | _vec3_  | {x: 1,y:1,z:1} |  The dimensions of the shape|
|  offset | _vec3_  |  {x: 0,y:0,z:0}   | Moves the shape relative to the local origin of the entity. |
|  debug | _boolean_  |  true  | Renders the wireframe of the shape |

