const ExtractTextPlugin = require('extract-text-webpack-plugin');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyWebpackPlugin = require("uglifyjs-webpack-plugin");
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const cssnano = require('cssnano');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');

const PreventCrossProjectImportsPlugin = require('../prevent-cross-project-imports-webpack-plugin');

var path = require('path');
var fs = require('fs');
 //Style loaders to be used in production (SASS files)
const prodSassLoaders = [
    {
        loader: 'css-loader',
        options: {
            importLoaders: 2,
            sourceMap: false,
        },
    },
    {
        loader: 'postcss-loader',
        options: {
            plugins: () => ([
                require('postcss-cssnext')(),
            ]),
            sourceMap: false,
        },
    },
    {
        loader: 'sass-loader',
        options: {
            sourceMap: false,
        },
    },
];

 //Style loaders to be used in development (SASS files)
const devSassLoaders = [
    'style-loader',
    {
        loader: 'css-loader',
        options: {
            importLoaders: 2,
            sourceMap: true,
        },
    },
    {
        loader: 'postcss-loader',
        options: {
            plugins: () => ([
                require('postcss-cssnext')(),
            ]),
            sourceMap: true,
        },
    },
    {
        loader: 'sass-loader',
        options: {
            sourceMap: true,
        },
    },
];

 //Loaders and corresponding options applied to files in production
exports.extractStyleSheets = ({ include, exclude } = {}) => {

    const plugin = new ExtractTextPlugin({
        //filename: '[name].[contenthash:8].css',
        filename: '[name]-bundle.css',
    });

    return {
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: plugin.extract({
                        fallback: "style-loader",
                        use: "css-loader"
                    }),
                },
                {
                    test: /\.scss$/,
                    include,
                    exclude,
                    use: plugin.extract({
                        use: prodSassLoaders,
                        fallback: 'style-loader',
                    }),
                },
            ],
        },
        plugins: [plugin],
    };
};

 //Loaders and corresponding options applied to files in development,
 //as style sheets are only extracted in production.
exports.loadStyleSheets = ({ include, exclude } = {}) => ({
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.scss$/,
                include,
                exclude,
                use: devSassLoaders,
            },
        ],
    },
});

exports.loadImages = ({ include, exclude, options } = {}) => {

    /* In orer to move specific project assets to other folders we need
       to be able to tell which assets belong to what projects. Easy-ish
       way to tell is to reflect the project name in the file name */
    const reflectProjectNameInAsset = {
        name (file) {
            const fileName = path.basename(file).split('.')[0];
            const projectRoot = file.slice(0, file.indexOf("\\wwwroot"));
            const projectName = projectRoot.slice(projectRoot.lastIndexOf("\\") + 1)
            
            // Todo: Add back in hash when I figure out how to reliably link to hashed files
            return projectName + '-' + fileName + '.[ext]';
        }
    }

    const urlOptions = Object.assign({},
        options,
        reflectProjectNameInAsset
    );

    return {
        module: {
            rules: [
                {
                    test: /\.(gif|png|jpe?g)$/i,
                    include,
                    exclude,

                    use: [
                        {
                            loader: 'url-loader',
                            options,
                        },
                        {
                            loader: 'image-webpack-loader',
                            options: {
                                pngquant: {
                                quality: '35-60',
                                speed: 4,
                                },
                        },
                        },
                    ],
                },
                {
                    test: /\.svg$/,
                    use: [
                        {
                            loader: 'file-loader',
                            options: reflectProjectNameInAsset
                        }
                    ]
                },
            ],
        },
    }
};

exports.loadFonts = ({ include, exclude, options } = {}) => ({
    module: {
        rules: [
            {
                // Capture eot, ttf, woff, and woff2
                test: /\.(eot|ttf|woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
                include,
                exclude,

                use: {
                    loader: 'file-loader',
                    options,
                },
            },
        ],
    },
});

exports.loadJavaScript = ({ include, exclude }) => ({
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                include,
                exclude,
                loader: 'babel-loader',
                options: {
                    presets: [
                        path.resolve(__dirname, "../node_modules/babel-preset-env"),
                        path.resolve(__dirname, "../node_modules/babel-preset-react")
                    ],
                    plugins: [
                        path.resolve(__dirname, "../node_modules/react-hot-loader/babel")
                    ],
                },
            },
        ],
    },
});

// To enable hot reload multiple files need to be set as entry points per bundle.
exports.setEntryPoints = ({ projectEntryPoints, hotReload }) => {
    if (!hotReload) return { entry: projectEntryPoints };

    const entryPoints = {};
    const hotModuleEntryTemplates = ['react-hot-loader/patch', 'webpack/hot/only-dev-server'];
    
    // Components need to be last in the array in order for the library output to expose them
    for (var project in projectEntryPoints) {
        entryPoints[project] = [...hotModuleEntryTemplates, projectEntryPoints[project]];
    }
    
    return { entry: entryPoints };
}


// TODO: Configure the output options based off mode (dev vs production)
exports.setOutputOptions = ({ outputOptions }) => ({
    output: outputOptions
})


exports.setBundleSizeLimits = () => ({
    performance: {
        hints: 'warning', // 'error' or false are valid too
        maxEntrypointSize: 250000, // in bytes
        maxAssetSize: 250000, // in bytes
    }
})

exports.generateSourceMaps = ({ type }) => ({
    devtool: type,
});

exports.extractBundles = (bundles) => ({
    plugins: bundles.map((bundle) => (
        new webpack.optimize.CommonsChunkPlugin(bundle)
    )),
});

exports.cleanBuildDirectory = ({root, path}) => ({
    plugins: [
        new CleanWebpackPlugin([path], {
            root,
        }),
    ],
});

exports.minifyJavaScript = () => ({
    plugins: [
        new UglifyWebpackPlugin()
    ],
});

exports.extractHTML = ({ template }) => {
    return {
        plugins: [
            new HtmlWebpackPlugin({
            filename: 'index.html',
            template,
            inject: true,
            }),
        ],
    }
};

exports.minifyCSS = () => ({
    plugins: [
        new OptimizeCSSAssetsPlugin({
            cssProcessor: cssnano,
            cssProcessorOptions: {
                discardComments: {
                    removeAll: true,
                },
                // Run cssnano in safe mode to avoid
                // potentially unsafe transformations.
                safe: true,
            },
            canPrint: false,
        }),
    ],
});

exports.setFreeVariable = (key, value) => {
    const env = {};
    env[key] = JSON.stringify(value);

    return {
        plugins: [
            new webpack.DefinePlugin(env),
        ],
    };
};

exports.enableHotReload = () => {
    return {
        devServer: {
            //open: true,
            host: "0.0.0.0",
            port: "3999",
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            quiet: true,
        },
        plugins: [
            new webpack.HotModuleReplacementPlugin(),
            new webpack.NamedModulesPlugin(),
        ],
    }
}

exports.bundleVisualizer = () => {
    return {
        plugins: [
            new BundleAnalyzerPlugin()
        ]
    }
}

exports.enableFriendlyErrors = () => {
    return {
        plugins: [
            new FriendlyErrorsWebpackPlugin()
        ]
    }
}

exports.preventCrossProjectImports = (options) => {
    return {
        plugins: [
            new PreventCrossProjectImportsPlugin(options),
            new webpack.NoEmitOnErrorsPlugin()
        ]
    }
}