import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import { dxService } from '../services';

export default function toql(): any {
    let options: vscode.InputBoxOptions = {
        placeHolder: 'Enter Tooling Object query',
        prompt: `Enter a TOQL query to get the results in a json file in the toql folder`,
    };
    return vscode.window.showInputBox(options).then(query => {
        if(!query) {
            return undefined;
        }
        return vscode.window.forceCode.conn.tooling.query(query).then(res => {
            let filePath: string = vscode.window.forceCode.projectRoot + path.sep + 'toql' + path.sep + Date.now() + '.json';
            var data: string = dxService.outputToString(res.records);
            return fs.outputFile(filePath, data, function() {
                return vscode.workspace.openTextDocument(filePath).then(doc => { 
                    vscode.window.showTextDocument(doc);
                    vscode.window.forceCode.showStatus("ForceCode: Successfully executed query!");
                });
            });
        });
    });
}
