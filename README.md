# Easy Photoshop Stable Diffusion Plugin

Easiest yet powerful Automatic1111-enabled Photoshop Stable Diffusion plugin

## Install dependencies

First, make sure that `npm` is installed on your system.

After you ensure that your terminal is in the root of this project, use `npm` to install the various dependencies needed:

```
npm install
```

If you prefer to use `yarn`, after you generate the `package-lock.json` file you can run the following line to import dependencies to a `yarn.lock` file: 

```
yarn import
```

## Build Process

There are two ways to build the plugin for use in Photoshop:

* `yarn watch` (or `npm watch`) will build a development version of the plugin, and recompile everytime you make a change to the source files. The result is placed in `dist` folder. 
* `yarn build` (or `npm build`) will build a production version of the plugin and place it in `dist` folder. It will not update every time you make a change to the source files.

> You **must** run either `watch` or `build` prior to trying to use within Photoshop!

## Launching in Photoshop

You can use the UXP Developer Tools to load the plugin into Photoshop.

If the plugin hasn't already been added to your workspace in the UXP Developer Tools, you can add it by clicking "Add Plugin...". You can either add the `manifest.json` file in the `dist` folder or the `plugin` folder.
* If you add the one in the `plugin` folder, then you need to update the relative path to the plugin build folder ( `dist` ) by clicking the ••• button > "Options" > "Advanced" > "Plugin build folder".
* During development, it is recommended to build the plugin using `yarn watch` and load the `manifest.json` in the (plugin build) `dist` folder. 

Once added, you can load it into Photoshop by clicking the ••• button on the corresponding row, and clicking "Load". Switch to Photoshop and you should see the starter panels.

## What this plugin does

This plugin doesn't do much, but does illustrate how to create two panels in Photoshop with `entrypoints.setup`, and how to create flyout menus. It also demonstrates the use of several Spectrum UXP widgets to create a simple color picker in the primary panel.

### Common Issues 

If you're getting errors with `npm install`, we can reinstall the project dependencies. Let's first make sure to delete `node_modules/*` from the `template` folder as well as the `package-lock.json` and `yarn.lock` file. Staying in the `template` directory, run `npm install` again and this will regenerate your `package-lock.json` file. 

PS Version : 23.2.0 or higher
UXP Version : 5.6 or higher