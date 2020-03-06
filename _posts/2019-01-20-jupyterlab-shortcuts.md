---
layout: post
title: "JupyterLab Keyboard Shortcut Cheat Sheet"
tags: jupyterlab shortcut cheatsheet python nodejs release
last_modified_at: 2020-03-03
---
A complete overview of the current JupyterLab keyboard shortcuts:<br>

<a href="/assets/jupyterlab-shortcuts/Shortcuts.png">
![shortcut cheat sheet](/assets/jupyterlab-shortcuts/Shortcuts.png#large)
</a>

(click on the picture to view it in full size or download the PDF below)

Notes: The key combinations generally have to be be pressed simultaneously,  but a `-` between one or more keys means that it is a sequence (press them one after another). The `Accel`erator key is usually mapped to `Ctrl`.

It is generated directly from the config file, so all combinations are included. Since JupyterLab is still under development some could not yet work. I only changed the order a bit, put related groups close to each other and to make it fit better on the page.
You can also download it as [PDF here](/assets/jupyterlab-shortcuts/Shortcuts.pdf).

The generator is implemented in Node.js, it is also on my Github as [jupyter-shortcuts](https://github.com/Jakeler/jupyter-shortcuts). You can simply clone it, run `yarn install` and then start it with `yarn start-default` to use the supplied default config file or `yarn start your/changed/config.json` to generate it from custom shortcuts. It provides a small http server with the generated page.

The json data can be obtained/edited in JupyterLab through: Settings > Advanced Settings Editor > Keyboard Shortcuts. There is currently (version 0.35.4 as time of writing) no builtin visual settings editor, this might change in the next versions with the [shortcutui extension](https://github.com/jupyterlab/jupyterlab-shortcutui).

Update 2020: I have updated the generator to the new 2.0 config format, here is a current default output:
<a href="/assets/jupyterlab-shortcuts/Shortcuts2020.png">
![shortcut cheat sheet](/assets/jupyterlab-shortcuts/Shortcuts2020.png)
</a>