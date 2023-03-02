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

* Works with local or remote installation of Automatic1111 (set via a URL)
* Just type a prompt, select a region on the image to generate/modify and see the results
* For inpainting, create a mask layer with one click and paint over it
* If you don't know what settings you want, let the plugin show you how different combinations work
* Save your favorite prompts with a single click and use them later just as easily
* The plugin remembers the last settings you used, so you can continue working from where you left off
* History of generations is preserved

Click the image below to see the demo:

[![Click to see the semo](https://i.imgur.com/DzNn2z3.jpg)](https://youtu.be/Ppj1-PPJ_sk "Easy Photoshop Stable Diffusion Plugin, Free & Open Source")

## Installation

This plugin requires `yarn` and `python 3.7+` installed. To install `yarn`, check [this link](https://classic.yarnpkg.com/lang/en/docs/install/).

### Download the plugin code

If you use git, you can get the plugin code via the following command:

```git clone https://github.com/artmineio/easy-photoshop-stable-diffusion-plugin.git```

Alternatively, you can navigate to the [github repository](https://github.com/artmineio/easy-photoshop-stable-diffusion-plugin), click on the green `Code` button and click "Download ZIP". Then unzip the contents. 

### Prepare the plugin

Once you have the plugin code locally on your machine, navigate to the `easy-photoshop-stable-diffusion-plugin` folder and run:

`run.bat` on Windows or `./run.sh` on Linux/Mac.

### Prepare Automatic1111

If you run [Automatic1111](https://github.com/AUTOMATIC1111/stable-diffusion-webui) UI locally, you will need to make sure to run it in `--api` mode. In order to do that:

* Navigate to the `stable-diffusion-webui` folder where it's installed
* On Windows edit the `webui-user.bat` file and replace:
* `set COMMANDLINE_ARGS=` 
* with:
* `set COMMANDLINE_ARGS=--api`
* For Linux/Mac, edit the `webui-user.sh` file and make sure to add the following at the end of the file:
* `export COMMANDLINE_ARGS="--api"`
  * In case it has problems starting, try the following configuration:
  * `export COMMANDLINE_ARGS="--api --skip-torch-cuda-test --no-half --use-cpu interrogate"`

When the plugin starts up it will try to connect to the standard local Automatic1111 URL, and it will ask you to specify
the correct URL if it fails. So if you have a remote installation of Automatic111 (or a different local port), just run
the plugin and give it your URL when it asks.

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

## Updating

Updating requires having the `git` command available. 
To update to the recent plugin version, stop the currently running `run.bat` or `run.sh` script (if any), and run:

`update.bat` on Windows or `./update.sh` on Linux/Mac.

Then run `run.bat` or `run.sh` again. 

## Usage

The plugin interface should guide you through the process of using it. The interface is also rich in tooltips, 
so if you don't know what a certain button does, hover over it with a mouse to see a short description. 
If you do something wrong the interface will try to correct you as well. 

The video tutorial is also available [on youtube](https://youtu.be/Ppj1-PPJ_sk).

## Clearing the history

If you want to clear the usage history, remove the contents of the `dist\output\` folder and reload the plugin in UXP

If you want to reset the settings to default, remove the contents of the `local_server\storage` folder

## Contributing

Contributions are welcome and very much appreciated! Feel free to create an issue or submit a pull request 
if you'd like to propose a change. Also, feel free to reach out over our [discord][discord-link]!
