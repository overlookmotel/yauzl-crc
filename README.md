# yauzl-crc.js

# yauzl unzipping with CRC32 check

## Current status

[![NPM version](https://img.shields.io/npm/v/yauzl-crc.svg)](https://www.npmjs.com/package/yauzl-crc)
[![Build Status](https://img.shields.io/github/actions/workflow/status/overlookmotel/yauzl-crc/test.yml?branch=master)](https://github.com/overlookmotel/yauzl-crc/actions)
[![Coverage Status](https://img.shields.io/coveralls/overlookmotel/yauzl-crc/master.svg)](https://coveralls.io/r/overlookmotel/yauzl-crc)

## Usage

[yauzl](https://www.npmjs.com/package/yauzl) for unzipping ZIP files with option for checking CRC32 values.

### Installation

```
npm install yauzl-crc
```

### Checking CRC32 values

This module is identical to yauzl, except it adds an option `validateCrc`.

```js
const yauzl = require('yauzl-crc');

yauzl.open('/path/to/file', { validateCrc: true }, (err, zipFile) => {
  zipFile.on('entry', entry => {
    zipFile.openReadStream(entry, (err, stream) => {
      stream.on('error', err => {
        // This will be called at end of stream if CRC
        // of data does not match what it should be
      });
    });
  });
});
```

### Customization

#### Using another version of yauzl

`.useYauzl()` method patches a specific `yauzl` object.

Only useful if you have a modified version of yauzl which you want to modify.

```js
const yauzlFork = require('my-yauzl-fork');
const yauzl = require('yauzl-crc').useYauzl(yauzlFork);
```

The yauzl object passed is cloned before it is modified, unless you set `clone` option to `false`:

```js
const yauzl = require('yauzl-crc').useYauzl(yauzlFork, { clone: false });
console.log(yauzl == yauzlFork); // true
```

## Versioning

This module follows [semver](https://semver.org/). Breaking changes will only be made in major version updates.

All active NodeJS release lines are supported (v16+ at time of writing). After a release line of NodeJS reaches end of life according to [Node's LTS schedule](https://nodejs.org/en/about/releases/), support for that version of Node may be dropped at any time, and this will not be considered a breaking change. Dropping support for a Node version will be made in a minor version update (e.g. 1.2.0 to 1.3.0). If you are using a Node version which is approaching end of life, pin your dependency of this module to patch updates only using tilde (`~`) e.g. `~1.2.3` to avoid breakages.

## Tests

Use `npm test` to run the tests. Use `npm run cover` to check coverage.

## Changelog

See [changelog.md](https://github.com/overlookmotel/yauzl-crc/blob/master/changelog.md)

## Issues

If you discover a bug, please raise an issue on Github. https://github.com/overlookmotel/yauzl-crc/issues

## Contribution

Pull requests are very welcome. Please:

* ensure all tests pass before submitting PR
* add an entry to changelog
* add tests for new features
* document new functionality/API additions in README
