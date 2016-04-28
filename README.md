How to test components
======================

To use mithril_component_tools for testing your mithril component you need to have these files in your repo:

* COMPONENT_NAME.js: COMPONENT_NAME is the name of your component. 
* COMPONENT_NAME.less: (Optional) Less styles if you need in your project. The tools automatically import `variables.less` & `mixin.less` from the bootstrap, then you don't need to add them manually.
* translation.json: Test resources you need in your app.

Then you can run `mct test COMPONENT_NAME` to test the component.
