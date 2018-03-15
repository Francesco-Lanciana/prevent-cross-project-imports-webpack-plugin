var path = require('path');
const fs = require('fs');


const compileAppMetaData = (appsDirectory) => {
    
    const appMetaData = fs.readdirSync(appsDirectory)
        /* Bundles contain a mix of public and private components. You can't make a bundle private, but you can make it a black box,
        i.e. no one else has access to the components contained within. The file that controls component access is the ComponentExports.jsx file.
        If a project doesn't have this file then the bundle is not built. Therefore at this point we just want to check that the project contains 
        this file, filtering out those that don't. */
        .filter(filename => {
        	const fullProjectFilePath = path.join(appsDirectory, filename);
        	const hasEntryPoint = fs.existsSync(path.join(fullProjectFilePath, 'Components/ComponentExports.jsx'));
        	
        	return hasEntryPoint;
    	})
    	/* The root property is used to create aliases for each component in a project. appCode defines the name of each bundle,
    	and entry is used as the entry point for each bundle. */
    	.reduce((entryPoints, projectFolderName) => {
    		const projectRootPath = path.join(appsDirectory, projectFolderName);

    		entryPoints[projectFolderName] = { 
    			root: projectRootPath, 
    			appCode: projectFolderName,
    			entry: path.resolve(projectRootPath, `Components/ComponentExports.jsx`)
    		};

    		return entryPoints;
    	}, {});

    return appMetaData;
}


/* Iterate over the components directory for a given app and create an alias object for each component. Any folder in 
the Components folder is assumed to contain a module where the module and the component within it have a name matching their containing folder name. */
const createComponentAliases = (appsMetaData, app) => {
    const sourceComponentsDirectory = path.resolve(appsMetaData[app].root, "Components");

    const componentJsxPaths = walkSync(sourceComponentsDirectory);

    return componentJsxPaths.reduce((aliases, componentJsxPath) => {
        const fileName = componentJsxPath.split(path.sep).pop().split('.')[0];
        const parentDirPath = path.resolve(componentJsxPath, '..');
        const parentDirName = parentDirPath.split(path.sep).pop();

        // In a way this enforces that each folder can have multiple components but only one root component
        if (fileName !== parentDirName) return aliases;

        const alias = app + '/Components/' + fileName;

        aliases[alias] = componentJsxPath;

        return aliases;
    }, {});
};

// Returns all jsx files in a directory (even nested files)
const walkSync = function(dir, toplevel=true) {
    const files = fs.readdirSync(dir);

    let filePaths = [];
    files.forEach(function(file) {
        const filePath = path.resolve(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            filePaths = [...filePaths, ...walkSync(filePath, false)];

        }
        else { 
            const filePathExtention = filePath.split(".").pop();
            if (!toplevel && filePathExtention === "jsx") {
                filePaths.push(filePath);
            }; 
        }
    });
    return filePaths;
};


/* Generate aliases for all components in every app, as well as aliases for other folders common to
all apps such as Images and Styles (apps are projects that contain a UI) */
exports.generateAllAppAliases = (appsMetaData) => {
    const appAliases = {};

    for (var app in appsMetaData) {
        Object.assign(appAliases, createComponentAliases(appsMetaData, app));

        // Each app should have common folders for images and app wide styles, these also need to be aliased.
        appAliases[app + "/Images"] = path.resolve(appsMetaData[app].root, "Images");
        appAliases[app + "/Styles"] = path.resolve(appsMetaData[app].root, "Styles");
    }

    return appAliases;
}


/*  
    * 'apps' encompasses all projects with a UI
    * 'core' encompasses all projects that contain libraries but expose no UI 

    ** We split projects into two categories to allow for easy automation when aliasing.
       Since all projects with a UI ('apps') use a standardized folder setup we can create
       aliases for key folders across all apps (e.g. Components, Styles). Even though core
       projects have no ComponentExports file they are still aliased for other projects to include.
*/
exports.compileProjectMetaData = () => {
    const appDirectory = path.resolve(__dirname, '../apps');

    return {
        apps: compileAppMetaData(appDirectory),
        core: {}
    }
}
