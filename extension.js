var vscode = require('vscode');
var path = require('path');
var child_process = require('child_process');
var diagnostics = require("./diagnostics");

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

var diagnosticCollection, diagnosticOrigin;
function activate(context) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection("Clang diagnostics");
    diagnosticOrigin = {};

    function didSaveTextDocument(e) {
        if (!((e.languageId === 'c') || (e.languageId === 'cpp'))) {
            return;
        }

        var fn = path.normalize(vscode.workspace.asRelativePath(e.fileName));

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

        var ch = crateOutputChannel();
        ch.clear();
        ch.appendLine(command);

        child_process.exec(command, { cwd: vscode.workspace.rootPath }, (err, stdout, stderr) => {
            ch.appendLine(stderr);

            let ds = {};
            function pushDiagnostic(relativePath, diagnostic) {
                var arr = ds[relativePath] || (ds[relativePath] = []);
                arr.push(diagnostic);
            }

            let split = (stderr || "").split(/\r?\n/);

            let i = 0;//, j = 0;
            for (; i < split.length; i++) {

                // clang can spit out errors in any file it touches regardless of entry point

                let ln = split[i];
                let startIndex = ln.indexOf(":");
                if (startIndex > 0) {
                    let path2 = ln.substring(0, startIndex);
                    let path3 = path.normalize(path2);

                    let d = diagnostics.parseDiagnostic(ln.substring(startIndex));
                    if (d) {
                        // This is a nice idea but it doesn't present very well in the problems view
                        // the user should check the "Clang diagnostics" output channel for this information.

                        // let prepend;
                        // for (; j < i; j++) {
                        //     prepend = (prepend || "") + split[j] + "\n";
                        // }

                        let message = d.message;
                        // if (prepend) {
                        //     message = prepend + message;
                        // }

                        let severity = vscode.DiagnosticSeverity.Hint;
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
                            for (let k in d.ranges) {
                                pushDiagnostic(path3, new vscode.Diagnostic(d.ranges[k], message, severity));
                            }
                        } else {
                            pushDiagnostic(path3, new vscode.Diagnostic(new vscode.Range(d.start, d.start), message, severity));
                        }
                    }
                }
            }

            // clear all diagnostics previously set by fn
            for (let k in diagnosticOrigin) {
                if (diagnosticOrigin[k] === fn) {
                    diagnosticCollection.delete(vscode.Uri.file(path.join(vscode.workspace.rootPath, fn)));
                }
            }

            // update all diagnostics for fn (with friends)
            for (let k in ds) {
                diagnosticCollection.set(vscode.Uri.file(path.join(vscode.workspace.rootPath, k)), ds[k]);
                diagnosticOrigin[k] = fn;
            }

            if (err) {
                if (ds.length == 0) {
                    // If it's a fatal error but we have no diagnostics,
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
    diagnosticOrigin = null;
}
exports.deactivate = deactivate;