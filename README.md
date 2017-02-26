# Clang Diagnostics for Windows

I wrote this extension becuase I was running into issues with the existing tooling for Visual Studio Code and Clang. This extension exists to support my own workflow and I'm commited to maintain this extension. I'll gladly fix bugs but pull requests should be discussed first. Fork if you want to hack off in another direction.

## Features

Display diagnostics from clang in Visual Studio Code.

## Requirements

You need to have the command `clang` in your path.

Additionally; unless you run Visual Studio Code from within an environment that sets system include search paths you will have to specify these through configuration. For example, Microsoft Visual C++ 2015 compiler (cl.exe) configuration is as follows:

> **Note:** the first line is for the Universal CRT.

```
{
  "clang.diagnostics.system.cpppath": [
    "C:\\Program Files (x86)\\Windows Kits\\10\\Include\\10.0.10150.0\\ucrt",
    "C:\\Program Files (x86)\\Windows Kits\\8.1\\Include\\um",
    "C:\\Program Files (x86)\\Windows Kits\\8.1\\Include\\shared"
  ]
}
```

System include search paths never yield diagnostics.

### How do I figure out what paths to include?

These are system internals and not something which I find to be well documented. However, it's relativly simple to reverse engineer.

1. Download Sysinternals Process Monitor (procmon). 
2. Add two filters
    1. *Process Name* is `cl.exe` (Visual C++)
    2. *Path* contains `<header file name>`
3. Enable capture
4. Invoke compiler (as you would to build normally).

Review the path information and set up include search paths accordingly.

## Extension Settings

```
{
  "clang.diagnostics.system.cpppath": [],
  "clang.diagnostics.cpppath": []
  "clang.diagnostics.cxxopts": []
}
```

`cpppath` include search paths. Subject to diagnostics. Include search paths are escaped as needed depending on platform. Note that Windows is the only supported platform, as of writing. `system.cpppath` is identical to `cpppath` except that no diagnostics is reported for these files.

`cxxopts` clang (C++) compiler frontend command line options. These are passed to the compiler as-is.

### Implementation details

The following options are hardcoded and shouldn't be changed.

```
-fsyntax-only
-fdiagnostics-print-source-range-info
-fno-caret-diagnostics
-fno-color-diagnostics
```

## Known Issues

Header files are treated as C++ files, regardless of thier extension. Header files passed directly to clang for analysis disable `-Wpragma-once-outside-header` to prevent false positives.

There's no way to distinguish what the cause of a Clang fatal error is, as such, these are shown in the output window. If the error didn't yield any diagnostic for the analyzed file the output window is shown with the relevant output from Clang directly. Hopefully this will make it easier to understand when Clang needs to be configured to work properly.

Analysis for multiple documents in parallel is done when configuration is updated. This can result in output getting lost in the output window. This only happens when the configuration is changed while more than 1 document with the `c` or `cpp` VS Code `<languageid>` is open at the same time.

## Release Notes

### 0.0.3

Bugfix: workspace relative include search paths.

### 0.0.2

Bugfix: support multiple source range info hints for the same diagnostic.

### 0.0.1

Initial release
