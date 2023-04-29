/* --------------------
 * yauzl-crc module
 * Patch `.openReadStream()` method to add `validateCrc` option
 * ------------------*/

'use strict';

// Modules
const {Transform: TransformStream, pipeline} = require('stream'),
	cloner = require('yauzl-clone'),
	{crc32} = require('@node-rs/crc32');

// Exports

/**
 * Patch `yauzl` to add `validateCrc` option.
 * @param {Object} yauzl - `yauzl` instance
 * @returns {Object} - Patched `yauzl` object
 */
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

			// Pipeline through stream which validates CRC32
			const crcStream = new CrcStream(entry.crc32); // eslint-disable-line no-use-before-define
			pipeline(stream, crcStream, () => {});
			cb(null, crcStream);
		});
	};

	// Return yauzl object
	return yauzl;
};

/*
 * AssertCrcStream
 */
class CrcStream extends TransformStream {
	constructor(crc) {
		super();
		this._expectedCrc = crc;
		this._crc = 0;
	}

	_transform(chunk, encoding, cb) {
		this._crc = crc32(chunk, this._crc);
		cb(null, chunk);
	}

	_flush(cb) {
		if (this._crc !== this._expectedCrc) {
			cb(new Error(`CRC32 does not match - expected ${this._expectedCrc}, got ${this._crc}`));
		} else {
			cb();
		}
	}
}
