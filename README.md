Mithril Component Tools
==========================
Install via `npm install -g mithril_component_tools`

To use any mithril_component_tools your mithril component you need to have these files in your repo:
* COMPONENT_NAME.js: COMPONENT_NAME is the name of your component. 

In order to use these tools, the suggested project is as follows:
```
project_dir/                --> where mct tool commands should be executed
  mithril_components/		--> contains all components
    component_name/             --> component_name directory
      component_name.js         --> the component
      test.js         			--> test of the component
      translation.json      	--> optional translation.json file
      component_name.less		--> optional component_name.less file

    ...           			--> other components follow the same structure
	package.json
```


Generate a translation JSON
===========================
Command: `mct generate path/to/COMPONENT_NAME.js LANGUAGE`

This will generate a translation.json file from all back-tick quoted words in the component.
Default translations are equal to the original language that can be rewritten later.

If a translation.json file already exists, the original translations will be kept, while new words are be added.

Test components
==========================
Command: `mct test path/to/COMPONENT_NAME.js LANGUAGE` (LANGUAGE optional, only executes if a translation.json file exists)

This will start an example of your mithril component at localhost:9004, if that port is taken, sequential ports are tried until an open port is found.

To use mithril_component_tools for testing your mithril component you should have these files in your repo:
* test.js: Required test file that is used for testing the component. This html of the component must be output through console logs.
* COMPONENT_NAME.less: (Optional) Less styles if you need in your project. The tools render imported `.less` files from the bootstrap node_module. This requires the bootstrap node module.
* translation.json: (Optional) Test resources you need in your app.

Publish components
==========================
Command: `mct publish ./ LANGUAGE` (LANGUAGE optional, only executes if a translation.json file exists)

*Requires bower to be installed

To use mithril_component_tools for testing your mithril component you need to have these files in your repo:
* COMPONENT_NAME.less: (Optional) Less styles if you need in your project. The tools render imported `.less` files from the bootstrap node_module.
* translation.json: (Optional) Test resources you need in your app.
