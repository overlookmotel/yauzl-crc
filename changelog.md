# Changelog

## 2.0.0

Breaking changes:

* Drop support for NodeJS < v16

Features:

* Use `@node-rs/crc32` for CRC32 calculation

Bug fixes:

* Fix hang if CRC32 mismatch

Refactor:

* Add entry point in package root

No code:

* JSDoc comments

Tests:

* Run tests with Jest

Docs:

* Reformat docs + tweaks
* Add section on versioning
* Remove old badges from README
* Reverse order of changelog
* Update license year
* Remove license indentation

Dev:

* Replace JSHint with ESLint
* Use Github Actions for CI
* Update dev dependencies
* Add `package-lock.json`
* Replace `.npmignore` with `files` key in `package.json`
* Update editorconfig
* `.gitattributes` file
* Re-order `.gitignore`

## 1.0.3

* Update `yauzl-clone` dependency
* Run Travis CI tests on Node v10
* Update dev dependencies

## 1.0.2

* Update `yauzl-clone` dependency

## 1.0.1

* Fix: Stream error propagation

## 1.0.0

* Initial release
