// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('vscode-html-attribute.insertAltFromClipboard',
            (textEditor, edit, args) => {
                return addImgAltTag(textEditor, edit, args);
            }
        )
    );
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('vscode-html-attribute.goToNextImgTag',
            (textEditor, edit, args) => {
                return jumpToImgTag(textEditor, 'next');
            }
        )
    );
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('vscode-html-attribute.goToPrevImgTag',
            (textEditor, edit, args) => {
                return jumpToImgTag(textEditor, 'prev');
            }
        )
    );
}

const addImgAltTag = async (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any) => {

    await Promise.all(textEditor.selections.map(async selection => {
        const startLine = selection.start.line;
        const startCharacter = selection.start.character;
        let altText = await vscode.env.clipboard.readText();
        if (!altText) {
            vscode.window.showWarningMessage('No text in clipboard');
            return;
        }
        altText = altText.replace(/^("|\n)+|("|\n)+$/g, '');
        //vscode.window.showInformationMessage(altText);
        altText = altText.replace(/"/g, '\\"');
        //vscode.window.showInformationMessage(altText);
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
        const srcEndIndex = lineText.indexOf('"', srcIndex + 5) + 1;
        const pos = srcIndex === -1 ? new vscode.Position(startLine, lineText.length - 1) : new vscode.Position(startLine, srcEndIndex);
        textEditor.edit((edit) => {
            edit.insert(pos, ` alt="${altText}"`);
        })
        textEditor.selection = new vscode.Selection(pos.line, pos.character, pos.line, pos.character);
        textEditor.revealRange(new vscode.Range(pos.line, pos.character, pos.line, pos.character));
        //vscode.window.showInformationMessage('Added alt attribute.');
    }));
}

const jumpToImgTag = async (editor: vscode.TextEditor, direction: 'next' | 'prev') => {
    let cursorPosition = editor.selection.active, // current cursor position
        lineNumber = cursorPosition.line, // current line number
        characterNumber = cursorPosition.character, // current character number
        line = editor.document.lineAt(lineNumber) as vscode.TextLine | null, // get current line object
        newPosition; // new position object

    while (line) {
        if (direction === 'next') {
            characterNumber = line.text.indexOf("<img", characterNumber);
        } else {
            characterNumber = line.text.slice(0, characterNumber).lastIndexOf("<img", characterNumber);
        }
        if (characterNumber !== -1) {
            // jump tag found
            newPosition = new vscode.Position(
                lineNumber,
                characterNumber + (direction === 'next' ? 1 : 0)
            );
            break;
        }

        // jump tag not found on the current line, go to the next/prev
        if (direction === 'next') {
            lineNumber++;
        } else {
            lineNumber--;
        }

        if (lineNumber >= 0 && lineNumber < editor.document.lineCount) {
            line = editor.document.lineAt(lineNumber);
            characterNumber = direction === 'next' ? 0 : line.text.length;
        } else {
            // next line is not available
            line = null;
        }
    }

    // set new cursor position if found
    if (newPosition) {
        editor.selections = [
            new vscode.Selection(newPosition, newPosition),
        ];
        editor.revealRange(new vscode.Range(newPosition, newPosition));
    }
}

// this method is called when your extension is deactivated
export function deactivate() { }
