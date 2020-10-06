# _SuperQuest!_ Oculus Quest AFrame Components

![image](https://img.shields.io/badge/status-WIP-orange) ![image](https://img.shields.io/badge/status-concept-lightgrey) [![Documentation Status](https://readthedocs.org/projects/superquest/badge/?version=latest)](https://superquest.readthedocs.io/?badge=latest)

Add-ons for A-Frame VR tailored for Oculus Quest and Oculus Quest 2.

Includes a lightweight physics system optimized for Oculus Browser, and components for virtual hands to pick up and manipulate virtual objects.

### [*See Physics Demo!*](https://glitch.com/~superquest-physics)

<pre> __                        ____                _
/ _\_   _ _ __   ___ _ __ /___ \_   _  ___ ___| |_
\ \| | | | '_ \ / _ | '__//  / | | | |/ _ / __| __|
_\ | |_| | |_) |  __| | / \_/ /| |_| |  __\__ | |_
\__/\__,_| .__/ \___|_| \___,_\ \__,_|\___|___/\__|
|        |_|
├── <b>assets</b>/ (<a href="/src/assets/assets.md">docs</a>)
│   ├── hands.ma
│   └── hands.fbx
├── <b>extras-collection</b>/ (<a href="/src/extras-collection/README.md">docs</a>) <sub> <img src="https://img.shields.io/badge/status-WIP-orange" alt="Project Status: WIP" /></sub>
│   ├── billboard.js
│   ├── clamp.js
│   ├── distribute-linear.js
│   ├── portals.js
│   ├── google-poly.js
│   ├── helpers.js
│   ├── literals.js
│   ├── rounded.js
│   ├── signals.js
│   ├── misc.js
│   └── json-loader.js
├── <b>quest-collection</b>/ (<a href="/src/quest/README.md">docs</a>)  <sub> <img src="https://img.shields.io/badge/status-WIP-orange" alt="Project Status: WIP" /></sub>
│   ├── superquest-haptics.js
│   ├── superquest-hands.js
│   └── superquest-teleporter-controls.js
└── <b>physics-lite</b>/ (<a href="/src/physics-lite/README.md">docs</a>) <sub> <img src="https://img.shields.io/badge/status-concept-lightgrey" alt="Project Status: WIP" /></sub>
    ├── superquest-physics-lite.js
    └── superquest-physics-lite.worker.js
</pre>

## Installation

Include this script tag after your A-Frame script tag in the head of your document.

```html
<script src="https://cdn.jsdelivr.net/gh/disasteroftheuniverse/SuperQuest/dist/SuperQuest.full.min.js"></script>
```

## Overview
* [*Physics Lite*](/src/physics-lite/README.md) - a lightweight alternative to [AFrame-Physics-System](https://github.com/n5ro/aframe-physics-system) with better performance in mobile browsers. It is simply a port of the ever-excellent [_Oimo.js_](https://github.com/lo-th/Oimo.js). 
* [*Oculus Quest Hand Component*](/src/quest-collection/README.md) - adds a unique prescribed hand model and a large range of prescribed hand animations to accomodate common use-cases. Used in conjunction with *Physics Lite* and/or *grabbable* component (included) to create unique, object-specific hand pick up/gesture/drop animations.
* [*Extra Components Collection*](/src/extras-collection/README.md) - Assorted Miscellanious components for UI and interaction.






