'use strict';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as xmlbuilder from 'xmlbuilder';

export async function promptForFolder(): Promise<string | undefined> {
    /*
     * promptForFolder
     * Prompts the user for the folder to create the project in and returns it.
     */
    try {
        return await vscode.window.showInputBox({
            prompt: 'Folder name to create project folder in. Must be in your workspace.',
            placeHolder: 'Folder name.'
        });
    } catch (e) {
        return;
    }
}

export async function promptForProjectName(): Promise<string | undefined> {
    /*
     * promptForProjectName
     * Prompts the user for the project name.
     */
    try {
        return await vscode.window.showInputBox({
            prompt: 'Project name. Will be used as the folder name of your java project.',
            placeHolder: 'Project name.'
        });
    } catch (e) {
        return;
    }
}

export async function promptForJavaVersion(): Promise<string | undefined> {
    /*
     * promptForJavaVersion
     * Prompts the user for the java version to use for the eclipse build.
     */
    try {
        return await vscode.window.showInputBox({
            prompt: 'The Eclipse java version to build with. (Ex: JavaSE-8, JavaSE-10)',
            value: 'JavaSE-10'
        });
    } catch (e) {
        return;
    }
}

export function findFolderInWorkspace(baseName: string, folders: vscode.WorkspaceFolder[]): string | undefined {
    /*
     * findFolderInWorkspace
     * Given a baseName and the folders to look through, return the fsPath if the baseName is found.
     * Else, return undefined.
     */
    for (var i = 0; i < folders.length; i++) {
        const element = folders[i];
        if (path.basename(element.uri.fsPath) === baseName) {
            return element.uri.fsPath;
        }
    }
    return undefined;
}

export async function getWorkspaceRoot(folders: vscode.WorkspaceFolder[], multi: boolean, baseName?: string): Promise<string | undefined> {
    /*
     * getWorkspaceRoot
     * Figures out which folder to make the project in.
     * Calls promptForFolder if there are multiple folders in the workspace.
     */
    if (multi) {  // Multiple folders in workspace
        if (baseName === "" || baseName === undefined) {  // Nothing entered
            return undefined;
        }

        const folderPath = findFolderInWorkspace(baseName, folders);
        if (folderPath) {
            return folderPath;
        } else {
            // Did not find baseName in workspace folders
            await vscode.window.showErrorMessage(
                'Could not find the folder ' + baseName + ' in your workspace. ' +
                'Please try again.'
            );
            return undefined;
        }
    } else {  // Single folder in workspace, return that folder
        return folders[0].uri.fsPath;
    }
}

export function createProjectFile(projectName: string): string {
    /*
     * createProjectFile
     * Create the xml for the .project file and return the result as a string.
     */
    const projectObj = {
        'projectDescription': {
            'name': projectName,
            'comment': '',
            'projects': {},
            'buildSpec': {
                'buildCommand': {
                    'name': 'org.eclipse.jdt.core.javabuilder',
                    'arguments': {}
                }
            },
            'natures': {
                'nature': 'org.eclipse.jdt.core.javanature'
            }
        }
    };
    const xml = xmlbuilder.create(projectObj, {encoding: 'UTF-8'});
    return xml.end({pretty: true});
}

export function createClassPathFile(javaVersion: string): string {
    /*
     * createClassPathFile
     * Create the xml for the .classpath file and return the result as a string.
     */
    const xml = xmlbuilder.create('classpath', {encoding: 'UTF-8'});
    
    var item = xml.ele('classpathentry');
    item.att('kind', 'con');
    item.att('path', 'org.eclipse.jdt.launching.JRE_CONTAINER/org.eclipse.jdt.internal.debug.ui.launcher.StandardVMType/' + javaVersion);
    var nestedItem = item.ele('attributes').ele('attribute');
    nestedItem.att('name', 'module');
    nestedItem.att('value', 'true');

    item = xml.ele('classpathentry');
    item.att('kind', 'src');
    item.att('path', 'src');

    item = xml.ele('classpathentry');
    item.att('kind', 'output');
    item.att('path', 'bin');

    return xml.end({pretty: true});
}

export async function createProjectFolder(root: string, projectName: string, javaVersion: string) {
    /*
     * createProjectFolder
     * Create the project folder, the src folder, the bin folder, and the .project
     * and .classpath files.
     */
    const fullPath = root + '/' + projectName;
    if (fs.existsSync(fullPath)){  // Make sure folder doesn't exist with same name
        await vscode.window.showErrorMessage(
            "A folder with the name " + projectName + " already exists."
        );
        return;
    }

    // Make all of the files and folders
    fs.mkdirSync(fullPath);
    const projectXMLString = createProjectFile(projectName);
    fs.writeFileSync(fullPath + '/.project', projectXMLString);
    const classpathXMLString = createClassPathFile(javaVersion);
    fs.writeFileSync(fullPath + '/.classpath', classpathXMLString);
    fs.mkdirSync(fullPath + '/src');
    fs.mkdirSync(fullPath + '/bin');
}

export async function command(context: vscode.ExtensionContext) {
    /*
     * NewJavaProject command
     * Runs the code.
     */
    // Figure out which folder to create in
    let folders = undefined;
    let multi = false;
    let root = undefined;
    if (vscode.workspace.workspaceFolders) {
        folders = vscode.workspace.workspaceFolders;
        multi = folders.length > 1;
        if (multi) {
            root = await getWorkspaceRoot(folders, multi, await promptForFolder());
        } else {
            root = await getWorkspaceRoot(folders, multi);
        }
    } else if (vscode.workspace.rootPath) {
        root = vscode.workspace.rootPath;
    } else {
        await vscode.window.showErrorMessage(
            "You don't have any folders in your workspace. " +
            "Please add a folder to your workspace and try again."
        );
        return;
    }
    if (root === undefined) {
        return;
    }
    
    // Prompt for project name and create
    const projectName = await promptForProjectName();
    // Prompt for Java Verison
    const javaVersion = await promptForJavaVersion();
    // Validate javaVersion
    if (javaVersion === undefined || javaVersion === "") {
        await vscode.window.showErrorMessage(
            'Invalid Java Version.'
        );
        return;
    }
    // Validate projectName and create projectFolder if true
    if (projectName){
        createProjectFolder(root, projectName, javaVersion);
    } else {
        return;
    }
}

// this method is called when the extension is activated
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand(
        'extension.NewJavaProject',
        () => command(context));

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
