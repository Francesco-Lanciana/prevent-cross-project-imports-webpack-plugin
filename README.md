# Prevent Cross Project Imports Plugin #

This plugin allows you to add control mechanisms to your projects' imports. You can decide if modules
from one project are able to import modules from another project, and what constitutes a project (what is the root of your projects). 

This is not really meant for the individual developer (I can't yet think of a good use case but let 
me know if you do). It really shines when your team are working on a web application that is comprised 
of multiple features that can be broken up amongst individuals or groups. Each of these features may
be a small application in it's own right. When bundling these applications there are really two ends of the
spectrum: 

1. Allow modules from one project to import modules from any other. In this case your bundles will be a mix
of several projects with the benefit that they are fully self contained.

2. Enforce strict boundaries between projects. Modules from one project can only import other modules from 
that same project. To use modules from another project/bundle you would include the bundle as a script tag,
making sure that those modules are exposed via webpacks library option and some careful exporting. This has
the disadvantage that your applications will not be as lean as in case 1, since if you need even one module 
from a different application you must import the entire application bundle to use it. The advantage however
is that by using a script tag you will immediately see changes made to the other applications' module once it
has been rebuilt (no need to rebuild your application just because they changed theirs).


Both of these extremes are valid, and so is any situation between. It really just depends on your project
requirements. In any case, this plugin can help enforce these rules so you can maintain a consistent 
methodology across all the people working on the application. This can be really helpful with large teams that
may contain inexperienced developers.



To run locally, you will need to:

1. Install NodeJS from [https://nodejs.org/](https://nodejs.org/).

2. Open a Command Prompt / Terminal and go to the *top* directory of your repository & type: `npm install` or `yarn install`

3. From the same directory type: `npm run start` to serve the project using Webpack Dev Server.


The repository contains the following folders:

**_app_**

All source files for this web-applications (projects) are located in this folder.

**_config_**

Contains all Webpack configuration for both development and production. These files are in turned called by **_webpack.config.js_**

**prevent-cross-project-imports-webpack-plugin**

The source code for the plugin (as well as an old implementation that attempted to hook into 
the resolver)
