// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('vscode-html-attribute.insertAltFromClipboard',
            (textEditor, edit, args) => {
                return closeSelections(textEditor, edit, args);
            }
        )
    );
}

const closeSelections = async (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any) => {

    await Promise.all(textEditor.selections.map(async selection => {
        const startLine = selection.start.line;
        const startCharacter = selection.start.character;
        const altText = await vscode.env.clipboard.readText();
        if (!altText) {
            vscode.window.showWarningMessage('No text in clipboard');
            return;
        }
        const lineText = textEditor.document.getText(new vscode.Range(startLine, 0, startLine, textEditor.document.lineAt(startLine).range.end.character));
        const index = lineText.indexOf('<img');
        if (index === -1) {
            vscode.window.showWarningMessage('No <img> tag found on this line.');
            return;
        }
        if (lineText.indexOf('<img', index + 1) > -1) {
            vscode.window.showWarningMessage('Found more than one <img> tag.');
            return;
        }
        const srcIndex = lineText.indexOf('src="', index);
        if (srcIndex === -1) {
            // append at end of line
            await edit.insert(new vscode.Position(startLine, lineText.length - 1), ` alt="${altText}"`);
        } else {
            const srcEndIndex = lineText.indexOf('"', srcIndex + 5);
            await edit.insert(new vscode.Position(startLine, srcEndIndex), ` alt="${altText}"`);
        }

        //vscode.workspace.applyEdit(edit);
        /*const tagToClose = findTags(() => {
            if (startLine < 0) {
                return;
            } else {
                const line = getLineText(textEditor, startLine--, startCharacter);
                startCharacter = Infinity;
                return line;
            }
        }, { ignoreTags });
        if (tagToClose) {
            const closeTag = `</${ tagToClose }>`;

            if (selection.start.line !== selection.end.line || selection.start.character !== selection.end.character) {
                edit.replace(selection, closeTag);
            } else {
                edit.insert(selection.anchor, closeTag);
            }
        }*/
    }));
}

// this method is called when your extension is deactivated
export function deactivate() {}
