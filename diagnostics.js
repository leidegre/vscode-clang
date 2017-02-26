
var vscode = require("vscode");

function ClangDiagnostic() {
  this.start = null;
  this.end = null;
  this.range = null;
  this.category = null;
  this.message = "";
}

var diagnosticPattern = /^:(\d+):(\d+)/;
var diagnosticPattern2 = /^:\{(\d+):(\d+)-(\d+):(\d+)\}/;
var diagnosticPattern3 = /^:\s*([^:]+):\s*/;

function parseDiagnostic(s) {
  var d = new ClangDiagnostic();

  var m = diagnosticPattern.exec(s);
  if (m) {
    let ln = parseInt(m[1]);
    let ch = parseInt(m[2]);
    d.start = new vscode.Position(ln - 1, ch - 1);
    s = s.substring(m[0].length);
  }

  m = diagnosticPattern2.exec(s);
  if (m) {
    let ln, ch;
    ln = parseInt(m[1]);
    ch = parseInt(m[2]);
    d.start = new vscode.Position(ln - 1, ch - 1);
    ln = parseInt(m[3]);
    ch = parseInt(m[4]);
    d.end = new vscode.Position(ln - 1, ch - 1);
    s = s.substring(m[0].length);
  } else {
    d.end = d.start;
  }

  d.range = new vscode.Range(d.start, d.end);

  m = diagnosticPattern3.exec(s);
  if (m) {
    d.category = m[1];
    s = s.substring(m[0].length);
  }

  d.message = s;

  return d;
}

exports.parseDiagnostic = parseDiagnostic;
