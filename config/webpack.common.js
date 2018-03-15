const parts = require('./webpack.parts');
const helpers = require('./webpack.helpers');
const merge = require('webpack-merge');
const path = require('path');
const fs = require('fs');

// Aliases are used to avoid imports that use the files absolute path (pain to type)
const generateAliases = (projectsMetaData) => (Object.assign({},
    helpers.generateAllAppAliases(projectsMetaData.apps),
    {
        // A place to manually enter in aliases that aren't based on apps
    }
));


exports.config = (projectsMetaData) => {
    const projectEntryPoints = {};

    for (var appCode in projectsMetaData.apps) {
        projectEntryPoints[appCode] = projectsMetaData.apps[appCode].entry;
    }
    
    return merge([
        {
            output: {
                path: path.resolve(__dirname, '../build'),
                filename: '[name]-bundle.js',
                publicPath: '/'
            },
            resolve: {
                alias: generateAliases(projectsMetaData),
                modules: [path.resolve(__dirname, "../node_modules"), "node_modules"],
                extensions: [".js", ".jsx", "css", "scss", ".json"]
            },
            bail: true 
        },
        // Remember that devserver has quiet: true to make this work nicely
        parts.enableFriendlyErrors(),
    ]);
};
