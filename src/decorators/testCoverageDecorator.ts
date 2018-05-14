import * as vscode from 'vscode';
import * as forceCode from './../forceCode';
import * as parsers from './../parsers';

// create a decorator type that we use to decorate small numbers
const coverageChannel: vscode.OutputChannel = vscode.window.createOutputChannel('Apex Test Coverage');
const uncoveredLineStyle: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(247,98,34,0.3)',
    // borderWidth: '1px',
    // borderStyle: 'dashed',
    overviewRulerColor: 'rgba(247,98,34,1)',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    isWholeLine: true,
    light: {
        // this color will be used in light color themes
        borderColor: 'rgba(247,98,34,1)'
    },
    dark: {
        // this color will be used in dark color themes
        borderColor: 'rgba(247,98,34,1)'
    },
});

const acovLineStyle: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(72,54,36,1)', isWholeLine: true });

// When this subscription is created (when the extension/Code boots), try to decorate the document
let timeout: any = undefined;
let activeEditor: vscode.TextEditor = vscode.window.activeTextEditor;
if (activeEditor) {
    updateDecorations();
}
// Export Function used when the Editor changes
export function editorUpdateApexCoverageDecorator(editor) {
    activeEditor = editor;
    if (editor) {
        updateDecorations();
    }
};
// Export Function used when the Document changes
export function documentUpdateApexCoverageDecorator(event) {
    if (activeEditor && event.document === activeEditor.document) {
        updateDecorations();
    }
};

export function updateDecorations() {
    if (!activeEditor) {
        return;
    }
    var uncoveredLineOptions: vscode.DecorationOptions[] = [];
    var lineOpts: vscode.TextEditorDecorationType = uncoveredLineStyle;
    if(activeEditor.document.languageId != 'apexCodeCoverage') {
        if (vscode.window.forceCode && vscode.window.forceCode.config && vscode.window.forceCode.config.showTestCoverage && activeEditor) {
            uncoveredLineOptions = getUncoveredLineOptions(activeEditor.document);
        }
    } else {
        lineOpts = acovLineStyle;
        for(var i: number = 2; i < activeEditor.document.lineCount; i += 2) {
            let decorationRange: vscode.DecorationOptions = { range: activeEditor.document.lineAt(i).range };
            uncoveredLineOptions.push(decorationRange);
        }
    }
    activeEditor.setDecorations(lineOpts, uncoveredLineOptions);
    // activeEditor.setDecorations(coveredDecorationType, coveredLines);
}

export function getUncoveredLineOptions(document: vscode.TextDocument) {
    var uncoveredLineDec: vscode.DecorationOptions[] = [];

    if(vscode.window.forceCode.workspaceMembers) {
        coverageChannel.clear();
        // get the id
        var fileName = document.fileName;
        // get the id    
        var curFileId: string = Object.keys(vscode.window.forceCode.workspaceMembers).find(cur => {
            return vscode.window.forceCode.workspaceMembers[cur].path === fileName;
        });

        if(curFileId && vscode.window.forceCode.codeCoverage[curFileId]) {
            uncoveredLineDec = getUncoveredLineOptionsFor(curFileId);
        }
    }
    return uncoveredLineDec;

    function getUncoveredLineOptionsFor(id) {
        var uncoveredLineDecorations: vscode.DecorationOptions[] = [];
        let fileCoverage: forceCode.ICodeCoverage = vscode.window.forceCode.codeCoverage[id];
        if (fileCoverage) {
            fileCoverage.Coverage.uncoveredLines.forEach(notCovered => {
                let decorationRange: vscode.DecorationOptions = { range: document.lineAt(Number(notCovered - 1)).range, hoverMessage: 'Line ' + notCovered + ' not covered by a test' };
                uncoveredLineDecorations.push(decorationRange);
                // Add output to output channel
                coverageChannel.appendLine(fileCoverage.ApexClassOrTrigger.Name + ' line ' + notCovered + ' not covered.')
            });
            var uncovered: number = fileCoverage.NumLinesUncovered;
            var total: number = fileCoverage.NumLinesCovered + fileCoverage.NumLinesUncovered;
            var percent = ((fileCoverage.NumLinesCovered / total) * 100).toFixed(2) + '% covered';
            vscode.window.forceCode.showStatus(fileCoverage.ApexClassOrTrigger.Name + ' ' + percent);
            coverageChannel.appendLine(fileCoverage.ApexClassOrTrigger.Name + '=> Uncovered lines: ' + uncovered + ', Total Line: ' + total + ', ' + percent);
        }
        return uncoveredLineDecorations;
    }
}