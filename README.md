Mithril Component Tools
==========================
Install via `npm install -g mithril_component_tools`

To use any mithril_component_tools your mithril component you need to have these files in your repo:
* COMPONENT_NAME.js: COMPONENT_NAME is the name of your component. 


Generate a translation JSON
===========================
Command: `mct generate COMPONENT_NAME.js LANGUAGE`

This will generate a translation.json file which with default translations equal to the original language that can be filled in later.

Test components
==========================
Command: `mct test COMPONENT_NAME.js LANGUAGE` (LANGUAGE optional, only runs if there is a translation.json file)

This will start an example of your mithril component at localhost:8080

To use mithril_component_tools for testing your mithril component you need to have these files in your repo:
* COMPONENT_NAME.less: (Optional) Less styles if you need in your project. The tools render imported `.less` files from the bootstrap node_module.
* translation.json: (Optional) Test resources you need in your app.

Publish components
==========================
Command: `mct publish COMPONENT_NAME.js LANGUAGE` (LANGUAGE optional, only runs if there is a translation.json file)

*Requires bower to be installed

To use mithril_component_tools for testing your mithril component you need to have these files in your repo:
* COMPONENT_NAME.less: (Optional) Less styles if you need in your project. The tools render imported `.less` files from the bootstrap node_module.
* translation.json: (Optional) Test resources you need in your app.
