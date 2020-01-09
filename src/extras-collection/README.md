# **Extras Collection**

A collection of miscellaneous components with varying degrees of usefulness.

## **rounded**


Creates a flat 2D rectangle with rounded corners. The appearance can be modified with [A-Frame 'material' component](https://aframe.io/docs/master/components/material.html).

**Example**

```html
<a-entity rounded="radius: 0.05; width: 1; height: 2;" material="color: blue;"></a-entity>
```

**Properties**

| Property | Property Type | Default Value |  Description  |
|---|---|---|---|
|  radius | _number_ |  0.0125 |  The radius of the rounded corners in meters. Note: this is in _addition_ to the width & height. |
|  width | _number_  |  1  | The width of the rectangle. |
|  height | _number_  |  1  | The height of the rectangle. |



## **clamp**



Restricts the movement of an object to a volume specified by minimum and maximum values in world space; Objects with the _clamp_ component cannot move beyond the limits defined by the min and max values.

**Example**

```html
<a-entity position="0 1 -1" clamp="min: -2 -4 -1; max: 2 5 3"></a-entity>
```

**Properties**

| Property | Property Type | Default Value |  Description  |
|---|---|---|---|
|  min | _Vector3_  |  {x:-1,y:-1,z:-1}  | The minimum allowed world position by axis. |
|  max | _Vector3_  |  {x:1,y:1,z:1}  | The maximum allowed world position by axis. |



## **billboard**



Aligns the Z-axis of an entity to always face towards a specified entity;

**Example**

```html
<a-entity id="foo" ></a-entity>
<a-entity billboard="src: #foo;"></a-entity>
```

**Properties**

| Property | Property Type | Default Value |  Description  |
|---|---|---|---|
|  src | _selector_  |  _null_  | Selector of the entity that the billboard should face towards. |
