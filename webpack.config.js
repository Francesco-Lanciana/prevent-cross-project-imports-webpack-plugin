var path = require('path');
const merge = require('webpack-merge');

const parts = require('./config/webpack.parts');
const common = require('./config/webpack.common');
const devConfig = require('./config/webpack.development');
const prodConfig = require('./config/webpack.production');
const helpers = require('./config/webpack.helpers');

const projectsMetaData = helpers.compileProjectMetaData();

// Contains configuration common to both development and production
const commonConfig = common.config(projectsMetaData);


/* 	
	* Development enables quick iteration at the expense of all optimization
	* Production is meant to heavily optimize each apps bundle at the 
	  expense of code readability (Don't debug in this mode)

	** IMPORTANT: The order of configuration object properties does not matter. 
	              The order for each option for any given property may very well matter.
*/
module.exports = (env) => {
    if (env.production) {
        return merge(commonConfig, prodConfig(projectsMetaData, env.analyze));
    }

    return merge(commonConfig, devConfig(projectsMetaData));
};
