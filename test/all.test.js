/* --------------------
 * yauzl-crc module
 * Tests
 * ------------------*/

'use strict';

// Modules
const chai = require('chai'),
	{expect} = chai,
	pathJoin = require('path').join,
	yauzlOriginal = require('yauzl'),
	yauzl = require('../index.js');

// Init
chai.config.includeStack = true;

// Tests

/* jshint expr: true */
/* global describe, it, beforeEach, afterEach */

const PATH = pathJoin(__dirname, 'test.zip'),
	CRC = 1081533905;

describe('Cloning', function() {
	describe('default', function() {
		it('clones yauzl', function() {
			expect(yauzl).not.to.equal(yauzlOriginal);
		});

		it('subclasses yauzl.ZipFile', function() {
			expect(yauzl.ZipFile).not.to.equal(yauzlOriginal.ZipFile);

			const zipFile = Object.create(yauzl.ZipFile.prototype);
			expect(zipFile).to.be.instanceof(yauzl.ZipFile);
			expect(zipFile).to.be.instanceof(yauzlOriginal.ZipFile);
		});
	});

	describe('.useYauzl()', function() {
		beforeEach(function() {
			this.yauzl = yauzl.useYauzl(yauzlOriginal);
		});

		it('clones yauzl', function() {
			expect(this.yauzl).not.to.equal(yauzlOriginal);
		});

		it('subclasses yauzl.ZipFile', function() {
			const {ZipFile} = this.yauzl;
			expect(ZipFile).not.to.equal(yauzlOriginal.ZipFile);

			const zipFile = Object.create(ZipFile.prototype);
			expect(zipFile).to.be.instanceof(ZipFile);
			expect(zipFile).to.be.instanceof(yauzlOriginal.ZipFile);
		});
	});
});

describe('`.openReadStream()`', function() {
	describe('without validateCrc option', function() {
		afterEach(function(cb) {
			if (this.zipFile) closeZip(this.zipFile, cb);
		});

		it('does not check CRC', function(cb) {
			getEntry(false, (err, {zipFile, entry}) => {
				this.zipFile = zipFile;
				if (err) return cb(err);

				entry.crc32 = 123;

				zipFile.openReadStream(entry, (err, stream) => {
					if (err) return cb(err);

					stream.on('data', () => {});
					stream.on('end', () => cb());
					stream.on('error', cb);
				});
			});
		});
	});

	describe('with validateCrc option', function() {
		afterEach(function(cb) {
			if (this.zipFile) closeZip(this.zipFile, cb);
		});

		it('stream emits error if CRC incorrect', function(cb) {
			getEntry(true, (err, {zipFile, entry}) => {
				this.zipFile = zipFile;
				if (err) return cb(err);

				const wrongCrc = 123;
				entry.crc32 = wrongCrc;

				zipFile.openReadStream(entry, (err, stream) => {
					if (err) return cb(err);

					stream.on('data', () => {});
					stream.on('end', () => cb(new Error('Completed without error')));
					stream.on('error', err => {
						expect(err.message).to.equal(`CRC32 does not match - expected ${wrongCrc}, got ${CRC}`);
						cb();
					});
				});
			});
		});

		it('stream does not emit error if CRC correct', function(cb) {
			getEntry(true, (err, {zipFile, entry}) => {
				this.zipFile = zipFile;
				if (err) return cb(err);

				zipFile.openReadStream(entry, (err, stream) => {
					if (err) return cb(err);

					stream.on('data', () => {});
					stream.on('end', () => cb());
					stream.on('error', cb);
				});
			});
		});
	});
});

/*
 * Helper functions
 */
function getEntry(validateCrc, cb) {
	yauzl.open(PATH, {validateCrc, autoClose: false, lazyEntries: true}, function(err, zipFile) {
		if (err) return cb(err);

		zipFile.on('error', err => cb(err, {zipFile}));
		zipFile.on('entry', entry => cb(null, {zipFile, entry}));
		zipFile.readEntry();
	});
}

function closeZip(zipFile, cb) {
	zipFile.on('close', () => cb());
	zipFile.on('error', cb);
	zipFile.close();
}
