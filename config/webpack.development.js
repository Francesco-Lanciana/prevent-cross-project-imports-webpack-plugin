const merge = require('webpack-merge');
const parts = require('./webpack.parts');
const path = require('path');


const developmentConfig = (projectsMetaData) => {

    // All apps contain UI written in particular frameworks (currently React). To transpile
    // this we need to let babel know the locations of files that need to be transpiled.
    const pathDirectories = Object.keys(projectsMetaData.apps).map((k) => projectsMetaData.apps[k].root);

    const projectEntryPoints = {};

    for (var appCode in projectsMetaData.apps) {
        projectEntryPoints[appCode] = projectsMetaData.apps[appCode].entry;
    }

    // File-loader (with source maps enabled) breaks without setting the publicPath to an absolute url
    const outputConfigDev = {
        devtoolModuleFilenameTemplate: 'webpack:///[absolute-resource-path]',
        publicPath: 'http://localhost:3999/', 
        library: '[name]'
    }

    var merged =  merge([
        // WTF why does this next line break???
        // parts.setEntryPoints({ projectEntryPoints: projectEntryPoints, hotReload: true }),
        parts.setEntryPoints({ projectEntryPoints: projectEntryPoints}),
        parts.setOutputOptions({ outputOptions: outputConfigDev }),
        parts.enableHotReload(),
        parts.loadJavaScript({ include: pathDirectories, exclude: /(node_modules|bower_components)/ }),
        parts.loadStyleSheets({ exclude: /node_modules/ }),
        parts.loadImages({ options: { limit: 25000 } }),
        parts.loadFonts(),
        parts.generateSourceMaps({ type: 'eval-source-map' }),
        parts.setFreeVariable( "DEVELOPMENT", true ),
        parts.preventCrossProjectImports({ 
            projectRootPaths: pathDirectories,
            //exemptProjects: [projectsMetaData.apps["second_project"].root]
         }),
    ]);
    return merged;
    
}


module.exports = (projectsMetaData) => {
    return developmentConfig(projectsMetaData);
};
