/* --------------------
 * yauzl-crc module
 * Patch `.openReadStream()` method to add `validateCrc` option
 * ------------------*/

'use strict';

// Modules
const util = require('util'),
	TransformStream = require('stream').Transform,
	cloner = require('yauzl-clone'),
	crc32 = require('buffer-crc32');

// Exports
module.exports = function(yauzl) {
	// Patch access methods to store `validateCrc` option
	cloner.patchAll(yauzl, original => (path, totalSize, options, cb) => {
		original(path, totalSize, options, (err, zipFile) => {
			if (err) {
				cb(err);
				return;
			}

			zipFile.validateCrc = !!options.validateCrc;
			cb(null, zipFile);
		});
	});

	// Patch `openReadStream` method to check CRC32 value
	const {ZipFile} = yauzl,
		{openReadStream} = ZipFile.prototype;

	ZipFile.prototype.openReadStream = function(entry, options, cb) {
		// Conform options
		if (cb == null) {
			cb = options;
			options = {};
		} else if (!options) {
			options = {};
		}

		// Work out if should validate CRC
		const validate = this.validateCrc
			&& (!entry.isCompressed() || options.decompress == null || options.decompress)
			&& (options.start == null || options.start === 0)
			&& (options.end == null || options.end === entry.compressedSize);

		// Open read stream
		openReadStream.call(this, entry, options, (err, stream) => {
			if (err) {
				cb(err);
				return;
			}

			// If not validating CRC, callback with stream
			if (!validate) {
				cb(null, stream);
				return;
			}

			// Chain validation stream
			const validateStream = new AssertCrcStream(entry.crc32);
			stream.on('error', err => validateStream.emit('error', err)); // eslint-disable-line no-shadow
			stream.pipe(validateStream);

			// Add `destroy` method which calls `.destroy()` on previous stream
			let destroyed = false;
			validateStream.destroy = function() {
				if (destroyed) return;
				destroyed = true;
				stream.unpipe(validateStream);
				stream.destroy();
			};

			// Callback with new stream
			cb(null, validateStream);
		});
	};

	// Return yauzl object
	return yauzl;
};

/*
 * AssertCrcStream
 */
function AssertCrcStream(crc) {
	TransformStream.call(this);
	this._expectedCrc = crc;
	this._crc = undefined;
}

AssertCrcStream.prototype._transform = function(chunk, encoding, cb) {
	this._crc = crc32.signed(chunk, this._crc);
	cb(null, chunk);
};

AssertCrcStream.prototype._flush = function(cb) {
	const crc = this._crc >>> 0; // eslint-disable-line no-bitwise
	if (crc !== this._expectedCrc) {
		cb(new Error(`CRC32 does not match - expected ${this._expectedCrc}, got ${crc}`));
	} else {
		cb();
	}
};

util.inherits(AssertCrcStream, TransformStream);
