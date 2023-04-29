/* --------------------
 * yauzl-crc module
 * Entry point
 * ------------------*/

'use strict';

// Modules
const yauzlOriginal = require('yauzl'),
	cloner = require('yauzl-clone');

// Imports
const patch = require('./patch.js');

// Exports
function use(yauzl, options) {
	// Conform options
	options = {clone: true, ...options};

	// Use default if not provided
	if (!yauzl) yauzl = yauzlOriginal;

	// Clone yauzl unless `options.clone` false
	if (options.clone) yauzl = cloner.clone(yauzl, {subclassZipFile: true});

	// Add promisfied methods
	patch(yauzl);

	// Add `use` methods
	yauzl.use = use;
	yauzl.useYauzl = use;

	// Return yauzl object
	return yauzl;
}

module.exports = use();
