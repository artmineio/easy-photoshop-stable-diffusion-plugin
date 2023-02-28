# Easy Photoshop Stable Diffusion Plugin

[![discord-badge]][discord-link]
[![twitter-badge]][twitter-link]

[discord-badge]: https://badgen.net/badge/Photoshop%20Stable%20Diffusion%20Plugin/discord/green
[discord-link]: https://discord.gg/4jHrg4cy
[twitter-badge]: https://badgen.net/badge/artmineio/twitter/blue?icon=twitter
[twitter-link]: https://twitter.com/artmineio

Easy to use yet powerful Automatic1111-enabled Photoshop Stable Diffusion plugin. If you are new to Stable Diffusion, 
the intuitive UI will guide you through the process of using it while setting all of its settings automatically. 
If you are a seasoned user, it will give you the full power of Automatic1111 UI within Photoshop while having you make
as little clicks or repetitive actions as possible.

* Works with local installation of Automatic1111
* Just type a prompt, select a region on the image to generate/modify and see the results
* For inpainting, create a mask layer with one click and paint over it
* If you don't know what settings you want, let the plugin show you how different combinations work
* Save your favorite prompts with a single click and use them later just as easily
* Specify any custom Automatic1111 URL for remote installation

## Installation

This plugin requires `yarn` and `python 3.7+` installed. To install `yarn`, check [this link](https://classic.yarnpkg.com/lang/en/docs/install/).

### Download the plugin code

If you use git, you can get the plugin code via the following command:

```git clone https://github.com/artmineio/easy-photoshop-stable-diffusion-plugin.git```

Alternatively, you can navigate to the [github repository](https://github.com/artmineio/easy-photoshop-stable-diffusion-plugin), click on the green `Code` button and click "Download ZIP". Then unzip the contents. 

### Prepare the plugin

Once you have the plugin code locally on your machine, navigate to the `easy-photoshop-stable-diffusion-plugin` folder and run:

`run.bat` on Windows or `./run.sh` on Linux/Mac.

### Load the plugin into Photoshop

* Run Photoshop. Navigate to Edit -> Preferences -> Plugins on Windows and make sure "Enable Developer Mode" is checked 
  * On Mac it would be Photoshop -> Settings... -> Plugins... 
* Run Adobe UXP Developer Tool
  * If you don't have it, make sure to install it as per [this link](https://developer.adobe.com/photoshop/uxp/devtool/installation/)
* Click "Add Plugin" and navigate to `easy-photoshop-stable-diffusion-plugin/dist` folder and pick the `manifest.json` file
  * Make sure to select the `manifest.json` from `dist` folder, *not* the `plugin` folder
* The plugin should appear in the list of plugins. Click on the three dots in the "Actions" column and click "Load"
* Open Photoshop, and in the menu navigate to Plugins -> Plugins Panel and click "Easy Stable Diffusion Plugin"

The plugin should be ready to use. In case of any errors the plugin should tell you what's wrong and how to resolve it.

## Usage

The plugin interface should guide you through the process of using it.
