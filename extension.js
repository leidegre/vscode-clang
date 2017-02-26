var vscode = require('vscode');
var path = require('path');
var child_process = require('child_process');
var diagnostics = require("./diagnostics");

var diagnosticCollection;

// The output channel is called "Clang diagnostics" and only used for fatal errors,
// errors that prevent Clang from completing its analysis. There errors can be user
// or configuration related. Fatal errors that generate no diagnostic for the file
// that is analyzed is considered external issues and are shown in the output window.
// This latter case is special and will also redirect attention to the output window.
var outputChannel;
function crateOutputChannel() {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel("Clang diagnostics");
    }
    return outputChannel;
}

function activate(context) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection();

    function didSaveTextDocument(e) {
        if (!((e.languageId === 'c') || (e.languageId === 'cpp'))) {
            return;
        }

        var fn = e.fileName;

        var conf = vscode.workspace.getConfiguration('clang.diagnostics');

        var args = [
            "-fsyntax-only",
            // see https://clang.llvm.org/docs/UsersManual.html#formatting-of-diagnostics
            "-fdiagnostics-print-source-range-info",
            "-fno-caret-diagnostics",
            "-fno-color-diagnostics",
        ];

        // for well known header file extensions we hint clang to not generate false positives for certain warnings.
        switch (path.extname(fn)) {
            case '.h': // todo: ambigous without a language option we can't differentiate between C and C++
            case '.hh': // who in their right mind uses this?
            case '.hpp':
                args.push("-Wno-pragma-once-outside-header"); // hack: don't know of a better way to work around this warning, too many false positives without it.
                args.push("-x c++-header");
                break;
        }

        args = args.concat(conf.get('system.cpppath').map(dir => `-isystem "${dir}"`));
        args = args.concat(conf.get('cpppath').map(dir => `-I"${dir}"`));
        args = args.concat(conf.get('cxxopts'));

        var command = `clang ${args.join(' ')} \"${fn}\"`;

        child_process.exec(command, { cwd: vscode.workspace.rootPath }, (err, stdout, stderr) => {
            var ch = crateOutputChannel();
            ch.clear();
            ch.appendLine(stderr);

            var split = (stderr || "").split(/\n+/);
            var ds = [];
            var i = 0, j = 0; // todo: prepend unmatches lines
            for (; i < split.length; i++) {
                if (split[i].indexOf(fn) == 0) {
                    var s = split[i].substring(fn.length);
                    var d = diagnostics.parseDiagnostic(s);
                    var severity = vscode.DiagnosticSeverity.Hint;
                    switch (d.category) {
                        case "warning":
                            severity = vscode.DiagnosticSeverity.Warning;
                            break;
                        case "fatal error":
                        case "error":
                            severity = vscode.DiagnosticSeverity.Error;
                            break;
                    }
                    if (d.ranges.length > 0) {
                        for (var i in d.ranges) {
                            ds.push(new vscode.Diagnostic(d.ranges[i], d.message, severity));
                        }
                    } else {
                        ds.push(new vscode.Diagnostic(new vscode.Range(d.start, d.start), d.message, severity));
                    }
                }
            }
            diagnosticCollection.set(e.uri, ds);

            if (err) {
                if (ds.length == 0) {
                    // If we have no diagnostics for this file 
                    // then it's _probably_ a configuration error.
                    ch.show(false);
                }
                return;
            }
        });
    }

    function didChangeConfiguration() {
        for (var k in vscode.workspace.textDocuments) {
            didSaveTextDocument(vscode.workspace.textDocuments[k]);
        }
    }

    var subscriptions = [];

    vscode.workspace.onDidSaveTextDocument(didSaveTextDocument, null, subscriptions);
    vscode.workspace.onDidChangeConfiguration(didChangeConfiguration, null, subscriptions);

    context.subscriptions.push(...subscriptions);
}
exports.activate = activate;

function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
    diagnosticCollection.dispose();
}
exports.deactivate = deactivate;