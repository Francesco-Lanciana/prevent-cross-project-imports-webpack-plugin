/*
    TODO: Switch to no chunkhash in name, until I figure out how to enable it.
    TODO: High five myself for that commonchunks 
*/

const merge = require('webpack-merge');
const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const parts = require('./webpack.parts');


const productionConfig = (projectsMetaData, analyze) => {

    // Get a unique set of the roots (pull path of wwwroot) for each project to allow babel to 
    // transpile the necessary jsx files in each project.
    const pathDirectories = Object.keys(projectsMetaData.apps).map((project) => projectsMetaData.apps[project].root);

    const projectEntryPoints = {};

    for (var appCode in projectsMetaData.apps) {
        projectEntryPoints[appCode] = projectsMetaData.apps[appCode].entry;
    }

    const outputConfigProd = {
        chunkFilename: '[name]-bundle.js',
        filename: '[name]-bundle.js',
        library: '[name]'
    }

    const prodConfig = merge([
        parts.setEntryPoints({ projectEntryPoints: projectEntryPoints, hotReload: false }),
        parts.setOutputOptions({ outputOptions: outputConfigProd }),
        parts.setBundleSizeLimits(),
        parts.cleanBuildDirectory({ root: path.resolve(__dirname, '..'), path: 'build' }),
        parts.minifyJavaScript(),
        parts.minifyCSS(),
        parts.extractStyleSheets(),
        parts.loadImages({
            options: {
                limit: 500, // After optimization limit
                name: '[name].[hash:8].[ext]',
            },
        }),
        parts.loadFonts({
            options: {
                name: './fonts/[name].[hash:8].[ext]',
                publicPath: '../',
            },
        }),
        parts.extractBundles([
            {
                name: 'libraries-stable',
                chunks: Object.keys(projectEntryPoints),
                minChunks: (module, count) => {
                    const libraries = ['react', 'react-dom', 'auth0-js'];

                    /* path.sep is necessary so we don't just pick up every module with 
                    react or react-dom in their name (e.g. react-overlays) */
                    return module.resource &&
                    module.resource.match(/\.js$/) &&
                    libraries.some((library) => module.resource.indexOf(library + path.sep) >= 0);
                },
            },
            {
                name: 'libraries-dynamic',
                chunks: Object.keys(projectEntryPoints),
                minChunks: (module, count) => (
                    module.resource &&
                    module.resource.indexOf('node_modules') >= 0 &&
                    module.resource.match(/\.js$/) &&
                    count >= 2
                ),
            },
            {
                name: 'common-app-modules',
                chunks: Object.keys(projectEntryPoints),
                minChunks: (module, count) => (count >= 2),
            },
            {
                name: 'manifest',
                chunks: ['libraries-stable', 'libraries-dynamic', 'common-app-modules'],
                minChunks: Infinity,
            },
        ]),
        // parts.extractHTML({
        //     template: path.join(PATHS.apps.Instogram.root, 'Pages/Explore.html'),
        // }),
        parts.loadJavaScript({
            include: pathDirectories,
            exclude: /(node_modules|bower_components)/,
        }),
        parts.setFreeVariable(
            'process.env.NODE_ENV',
            'production'
        ),
    ]);

    /* It's really important to be able to analyze the output of the production build so
    we can tell if there is a lot of overlap between bundles, or if unnecessary libraries are included */
    if (analyze) {
        return merge([ prodConfig, parts.bundleVisualizer() ]);
    } else {
        return prodConfig;
    }

}


module.exports = (projectsMetaData, analyze) => {
  return productionConfig(projectsMetaData, analyze);
};
