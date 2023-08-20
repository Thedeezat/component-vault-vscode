const vscode = require("vscode");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Select code snippet
  let disposable = vscode.commands.registerCommand(
    "component-vault.myContextMenuCommand",

    async function () {
      const name = await vscode.window.showInputBox({
        prompt: "Enter a name for the code snippet",
        placeHolder: "Code Snippet Name",
      });

      if (name) {
        const snippets = getSavedSnippets(context.workspaceState);

        if (snippets.some((snippet) => snippet.name === name)) {
          vscode.window.showWarningMessage(
            "A code snippet with this name already exists. Please choose a different name or update the existing snippet."
          );
          return;
        }

        const editor = vscode.window.activeTextEditor;

        if (!editor) {
          return;
        }

        let selectedText = editor.document.getText(editor.selection);

        if (!selectedText.trim()) {
          const cursorPosition = editor.selection.active;
          const currentLine = editor.document.lineAt(cursorPosition.line);
          selectedText = currentLine.text;
        }
        if (!selectedText.trim()) {
          vscode.window.showWarningMessage("No code snippet to save!");
          return;
        }

        // Save the snippet to workspaceState
        saveSnippetToWorkspaceState(context, name, selectedText);

        // Handle the user-provided name and perform the saving logic here
        const message = `Code snippet saved as "${name}"`;
        vscode.window.showInformationMessage(message);
      } else {
        vscode.window.showWarningMessage("Code snippet name cannot be empty!");
      }
    }
  );

  // Insert save code snippet
  let insertSnippetCommand = vscode.commands.registerCommand(
    "component-vault.insertCodeSnippet",

    async function () {
      const snippets = getSavedSnippets(context.workspaceState);

      if (snippets.length === 0) {
        vscode.window.showInformationMessage("No saved snippets available.");
        return;
      }

      const snippetNames = snippets.map((snippet) => snippet.name);

      console.log(`Insert Code Snippet Name: ${snippetNames}`);

      const selectedSnippetName = await vscode.window.showQuickPick(
        snippetNames,
        {
          placeHolder: "Select a code snippet to insert",
        }
      );

      if (selectedSnippetName) {
        const selectedSnippet = snippets.find(
          (snippet) => snippet.name === selectedSnippetName
        );
        if (selectedSnippet) {
          insertSnippet(selectedSnippet.code);
        }
      }
    }
  );

  // Update existing snippet
  let updateSnippetCommand = vscode.commands.registerCommand(
    "component-vault.updateCodeSnippet",
    async function () {
      const snippets = getSavedSnippets(context.workspaceState);

      if (snippets.length === 0) {
        vscode.window.showInformationMessage("No saved snippets available.");
        return;
      }

      const snippetNames = snippets.map((snippet) => snippet.name);

      const selectedSnippetName = await vscode.window.showQuickPick(
        snippetNames,
        {
          placeHolder: "Select a code snippet to update",
        }
      );
      if (selectedSnippetName) {
        const selectedSnippet = snippets.find(
          (snippet) => snippet.name === selectedSnippetName
        );
        if (selectedSnippet) {
          const updatedCode = await vscode.window.showInputBox({
            prompt: `Update code snippet "${selectedSnippet.name}"`,
            value: selectedSnippet.code,
            placeHolder: "Enter updated code",
            multiline: true,
          });

          if (updatedCode !== undefined) {
            selectedSnippet.code = updatedCode;
            saveSnippets(context.workspaceState, snippets);
            vscode.window.showInformationMessage(
              `Code snippet "${selectedSnippet.name}" updated.`
            );
          }
        }
      }
    }
  );

  // Delete an existing code snippet
  let deleteSnippetCommand = vscode.commands.registerCommand(
    "component-vault.deleteCodeSnippet",
    async function () {
      const snippets = getSavedSnippets(context.workspaceState);

      if (snippets.length === 0) {
        vscode.window.showInformationMessage("No saved snippets available.");
        return;
      }

      const snippetNames = snippets.map((snippet) => snippet.name);

      const selectedSnippetName = await vscode.window.showQuickPick(
        snippetNames,
        {
          placeHolder: "Select a code snippet to delete",
        }
      );
      if (selectedSnippetName) {
        const newSnippets = snippets.filter(
          (snippet) => snippet.name !== selectedSnippetName
        );

        if (newSnippets.length < snippets.length) {
          saveSnippets(context.workspaceState, newSnippets);
          vscode.window.showInformationMessage(
            `Code snippet "${selectedSnippetName}" deleted.`
          );
        }
      }
    }
  );

  context.subscriptions.push(
    disposable,
    insertSnippetCommand,
    updateSnippetCommand,
    deleteSnippetCommand
  );
}

// Saved selected snippet to vscode storage
function saveSnippetToWorkspaceState(context, name, code) {
  const snippets = context.workspaceState.get("codeSnippets", []);
  snippets.push({ name, code });
  context.workspaceState.update("codeSnippets", snippets);
}

// Collect saved snippet
function getSavedSnippets(workspaceState) {
  return workspaceState.get("codeSnippets", []);
}

// Insert saved snippet
function insertSnippet(code) {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    editor.edit((editBuilder) => {
      editBuilder.insert(editor.selection.active, code);
    });
  }
}

// Save updated snippets to workspaceState
function saveSnippets(workspaceState, snippets) {
  workspaceState.update("codeSnippets", snippets);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
