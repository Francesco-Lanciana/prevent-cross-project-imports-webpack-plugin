const ModuleDependencyError = require("webpack/lib/ModuleDependencyError");

var path = require('path');
var fs = require('fs');

class PreventCrossProjectImportsPlugin {

    constructor(options) {
        this.defaultOptions = { projectRootPaths: [], exemptProjects: [], ignoreFilesOutsideProjects: true };
        this.options = Object.assign(this.defaultOptions, options);

        this.dependencyProjectExempt = this.dependencyProjectExempt.bind(this);
    }

    apply(compiler) {
        compiler.plugin('compilation', (compilation, params) => {
            const self = this;
			compilation.plugin("finish-modules", function (modules) {
                let error;
                
				const validImports = modules.filter((module) => {
                    return (module.context.indexOf("node_modules") === -1);
                }).every((module) => {
                    const modulePath = module.context;

                    for (let dependency of module.dependencies) {
                        const dependencyPath = dependency.module && dependency.module.context;

                        if (self.validDependencyPreliminaryChecks(modulePath, dependencyPath)) continue;

                        // Check that the module being imported is contained within a different project as the importing project
                        const violationMetaData = self.checkCrossingOfProjectBoundaries(modulePath, dependencyPath);
                        if (!violationMetaData) continue;

                        // Check that the requested module is not contained within a project that is exempt from this rule
                        if (Array.isArray(self.options.exemptProjects) && self.options.exemptProjects.length > 0) {
                            if (self.dependencyProjectExempt(dependencyPath)) continue;
                        }
                        
                        error = self.constructErrorMessage(module, dependency, violationMetaData);

                        // We now know they are in different projects and this is not allowed so throw an error
                        return false;
                    }

                    // All dependencies of the one module were valid
                    return true;
                });

                //If there is an error than we need to abort the compilation
                if (error) this.errors.push(error);
			});
        });
    } 

    constructErrorMessage(module, dependency, violationMetaData) {
        const errorData = 'Importer project: ' + violationMetaData.module + '\n Imported project: ' + violationMetaData.dependency + '\n\n';
                        
        const errorIndex = module._source._value.indexOf(dependency.request);
        const tempString = module._source._value.substring(0, errorIndex);
        const lineNumber = (tempString.match(/require\(/g) || []).length;

        const errorLineReport = ' Import number: ' + lineNumber + ' (Most likely on line ' + lineNumber + ')\n';
        const errorFile = ' File: ' + module.resource.split(path.sep).pop() + '\n\n';

        const errorReport = errorData + errorLineReport + errorFile;

        const error = new ModuleDependencyError(module, { message: errorReport + `Remember we always want to maintain seperation between 
        applications. You have tried to import a module from *${violationMetaData.dependency}* while inside 
        *${violationMetaData.module}*, and due to the way Webpack generates its bundles (via the dependency graph) 
        this will result in one application being merged with the other. This will cause issues with your app not seeing 
        the changes made to *${violationMetaData.dependency}* without a rebuild. To avoid seeing this error remove the 
        import and simply bring in the necessary bundle via a script tag =)`.replace(/\s+/g, ' '), 
        stack: ''});

        return error;
    }


    dependencyProjectExempt(dependencyPath) {
        let projectExempted = false;
        for (let exemptProjectIndex = 0; exemptProjectIndex < this.options.exemptProjects.length; exemptProjectIndex++) {
            const exemptProject = this.options.exemptProjects[exemptProjectIndex];
            
            if (this.requestedModuleInsideProject(exemptProject, dependencyPath)) {
                projectExempted = true;
                break;
            }
        }
        if (projectExempted) return true;
        else return false;
    }


    validDependencyPreliminaryChecks(modulePath, dependencyPath) {
        // TODO: Not confident this context is correct...
        const pluginContext = path.resolve(__dirname, '..');

        // Dependencies have different types, with only specific dependencies actually pointing to a file
        if (dependencyPath === undefined || dependencyPath === null) return true;

        /* The entry points of a project are dependencies on the config itself, so the module path will be
        set to be path of the config folder itself. This is a special case in which case the import can be
        from a different project and it's 100% ok */
        if (modulePath === pluginContext) return true; 

        /* Check if the module being imported or doing the importing sits within node_modules. 
        These modules are ignored because you gain nothing by enforcing this seperation */
        if (modulePath.indexOf("node_modules") !== -1 || dependencyPath.indexOf("node_modules") !== -1) return true; 
        
        return false;
    }


    checkCrossingOfProjectBoundaries(modulePath, dependencyPath) {

        // Custom checks can be done to see if two modules should not be interacting directly
        if (this.options.customProjectComparator) {
            return this.options.customProjectComparator(dependencyPath, modulePath);
        }

        // We will delete properties as we check (don't want to delete our options)
        const projectRootPaths = this.options.projectRootPaths.slice(0);

        // Check if the module import crosses project boundaries and whether that is allowed
        for (let i = 0; i < projectRootPaths.length; i++) {
            const projectPath = projectRootPaths[i];
            
            const dependencyInProject = this.requestedModuleInsideProject(projectPath, dependencyPath);
            const moduleInProject = this.requestedModuleInsideProject(projectPath, modulePath);

            if (moduleInProject && dependencyInProject) return false;

            // We now know the modules are in different projects
            if (moduleInProject !== dependencyInProject) {

                const projectsResponsible = {};
                const moduleNotInProject = !dependencyInProject ? dependencyPath : modulePath;

                if (moduleInProject) projectsResponsible["module"] = projectRootPaths.splice(i,1)[0].split(path.sep).pop();
                else projectsResponsible["dependency"] = projectRootPaths.splice(i,1)[0].split(path.sep).pop();

                // We can ignore modules outside of projects being imported or importing others via options
                if (!this.options.ignoreFilesOutsideProjects) return true;
                else {
                    // Check if the module is inside any of the remaining projects
                    for (let j = 0; j < projectRootPaths.length; j++) {
                        const projectRootPath = projectRootPaths[j];

                        if (this.requestedModuleInsideProject(projectRootPath, moduleNotInProject)) {

                            if (projectsResponsible["module"]) projectsResponsible["dependency"] = projectRootPath.split(path.sep).pop();
                            else projectsResponsible["module"] = projectRootPath.split(path.sep).pop();

                            return projectsResponsible;
                        }
                    }
                    // The module is not inside any projects
                    return false;
                }

            }

            projectRootPaths.splice(i,1);
        }

        
        /* If we got here it means a file not in any project (where a project is defined as the folder
        containing an entry point) imported another file also not in any project. This is definitely possible
        if you have a directory with helper files for example, and these are not bundled seperately. */
        if (this.options.ignoreFilesOutsideProjects) return false;

        /* We have exhausted all the easy options, now we use the two paths and try implicitly deduce if they 
        are in the same project. Without any assumptions or input this is literally impossible so we will assume
        that the top level of each project contains a package.json. You can also pass in your own function that 
        performs this comparison instead */
        
    }

    // The project path needs to be the top level of the project otherwise this may break
    requestedModuleInsideProject(projectPath, modulePath) {
        const insideProject = path.dirname(modulePath).indexOf(projectPath) !== -1;

        return insideProject;
    }
}

module.exports = PreventCrossProjectImportsPlugin;