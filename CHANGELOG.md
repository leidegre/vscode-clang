# Change Log

All notable changes to extension will be documented in this file.

## [0.0.6] - 2017-03-02

### Changed
- Relative paths anchored at the workspace root instead of absolute paths are now used when invoking `clang`.

## [0.0.3] - 2017-02-26

### Changed
- Child process anchored at workspace.rootPath. Fixes issues with relative include search paths but they have to be relative the workspace.rootPath.

## [0.0.2] - 2017-02-26

### Changed
- Clang output for last command is always kept in output channel "Clang diagnostics", used to be only for fatal errors. Focus is still only changed if a fatal error occurs.
