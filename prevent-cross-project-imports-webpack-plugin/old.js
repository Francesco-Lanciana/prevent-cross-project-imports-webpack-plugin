class PreventCrossProjectImportsPlugin {

    constructor(options) {
        this.defaultOptions = { entryPoints: [], exemptProjects: [], ignoreFilesOutsideProjects: true };
        this.options = Object.assign(this.defaultOptions, options);
    }

    apply(resolver) {
        resolver.plugin('resolved', (request, callback) => {
            const importIssuer = request.context.issuer;
            const requestedModuleFullPath = request.path;

            var obj = Object.assign({}, request);
            callback('TEST', obj);

            if (importIssuer && requestedModuleFullPath) {
                /* First check if the module being imported or doing the importing sits within node_modules. 
                These modules are ignored because you gain nothing by enforcing this seperation */
                if (importIssuer.indexOf("node_modules") !== -1 || requestedModuleFullPath.indexOf("node_modules") !== -1) return;


                // Check that the module being imported is contained within a different project as the importing project
                if (this.moduleImportsCrossedProjectBoundaries(requestedModuleFullPath, importIssuer)) return;


                // Check that the requested module is not contained within a project that is exempt from this rule
                if (Array.isArray(this.options.exemptProjects) && this.options.exemptProjects.length > 0) {
                    for (let exemptProject of this.options.exemptProjects) {
                        if (this.isChildOf(requestedModuleFullPath, exemptProject)) {
                            return;
                        }
                    }
                }

                // We now know they are in different projects and this is not allowed so throw an error

            }

            // var obj = Object.assign({}, request);
            // resolver.applyPluginsAsyncSeries1("result", obj, function(err) {
            //     if(err) return callback(err);
            //     callback(null, obj);
            // });
          
        });
    } 

    moduleImportsCrossedProjectBoundaries(requestedModule, importIssuer) {

        // We will delete properties as we check (don't want to delete our options)
        const entryPoints = Object.assign({}, this.options.entryPoints);

        // Check if the module import crosses project boundaries and whether that is allowed
        for (let project in entryPoints) {
            const projectPath = entryPoints[project];

            // TODO: Fix this logic
            const reqModuleInProject = path.dirname(requestedModule).indexOf(projectPath);
            const impIssuerInProject = path.dirname(importIssuer).indexOf(projectPath);

            if (reqModuleInProject && impIssuerInProject) return false;

            // Modules not in any project can be ignored via options, so we need to check for that now
            if (reqModuleInProject !== impIssuerInProject) {
                delete entryPoints[project];

                const moduleNotInProject = reqModuleInProject ? importIssuer : requestedModule;

                if (this.options.ignoreFilesOutsideProjects) {
                    for (let projectPath of entryPoints) {
                        // TODO: Write logic to detect if module in project (return true if found)
                    }

                    return false;
                } else {
                    return true;
                }

            }

            delete entryPoints[project];
        }

        
        /* If we got here it means a file not in any project (where a project is defined as the folder
        containing an entry point) imported another file also not in any project. This is definitely possible
        if you have a directory with helper files for example, and these are not bundled seperately. */
        if (this.options.ignoreFilesOutsideProjects) return false;

        /* We have exhausted all the easy options, now we use the two paths and try implicitly deduce if they 
        are in the same project. Without any assumptions or input this is literally impossible so we will assume
        that the top level of each project contains a package.json. You can also pass in your own function that 
        performs this comparison instead */
        if (this.options.customProjectComparator) this.options.customProjectComparator(requestedModule, importIssuer);
        else {

        }


    }

    isChildOf(child, parent) {
        if (child === parent) return false;

        const parentTokens = parent.split(path.sep).filter(i => i.length);
        return parentTokens.every((t, i) => child.split(path.sep)[i] === t);
    }
}


// exports.preventCrossProjectImports = (options) => {
//     return {
//         resolve: {
//             plugins: [
//                 //new PreventCrossProjectImportsPlugin(options)
//             ]
//         }
//     }
// }