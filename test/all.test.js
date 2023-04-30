/* --------------------
 * yauzl-crc module
 * Tests
 * ------------------*/

/* eslint-disable jest/no-done-callback */
/* eslint jest/expect-expect: ["error", {"assertFunctionNames": [
	"expect", "testOpen", "testFromFd", "testFromBuffer", "testFromRandomAccessReader"
]}] */

'use strict';

// Modules
const pathJoin = require('path').join,
	yauzlOriginal = require('yauzl'),
	yauzl = require('../index.js');

// Tests

const PATH = pathJoin(__dirname, 'test.zip'),
	CONTENT = '0123456789\n',
	CRC = 1081533905;

describe('Cloning', () => {
	describe('default', () => {
		it('clones yauzl', () => {
			expect(yauzl).not.toBe(yauzlOriginal);
		});

		it('subclasses yauzl.ZipFile', () => {
			expect(yauzl.ZipFile).not.toBe(yauzlOriginal.ZipFile);

			const zipFile = Object.create(yauzl.ZipFile.prototype);
			expect(zipFile).toBeInstanceOf(yauzl.ZipFile);
			expect(zipFile).toBeInstanceOf(yauzlOriginal.ZipFile);
		});
	});

	describe('.useYauzl()', () => {
		let patchedYauzl;
		beforeEach(() => {
			patchedYauzl = yauzl.useYauzl(yauzlOriginal);
		});

		it('clones yauzl', () => {
			expect(patchedYauzl).not.toBe(yauzlOriginal);
		});

		it('subclasses yauzl.ZipFile', () => {
			const {ZipFile} = patchedYauzl;
			expect(ZipFile).not.toBe(yauzlOriginal.ZipFile);

			const zipFile = Object.create(ZipFile.prototype);
			expect(zipFile).toBeInstanceOf(ZipFile);
			expect(zipFile).toBeInstanceOf(yauzlOriginal.ZipFile);
		});
	});
});

describe('`.openReadStream()`', () => {
	let zipToClose;
	beforeEach(() => {
		zipToClose = null;
	});
	afterEach((cb) => {
		if (zipToClose) {
			zipToClose.on('close', () => cb());
			zipToClose.on('error', cb);
			zipToClose.close();
		}
	});

	describe('without validateCrc option', () => {
		it('does not check CRC', (cb) => {
			getEntry(false, (err, {zipFile, entry}) => {
				zipToClose = zipFile;
				if (err) {
					cb(err);
					return;
				}

				entry.crc32 = 123;

				zipFile.openReadStream(entry, (err, stream) => { // eslint-disable-line no-shadow
					if (err) {
						cb(err);
						return;
					}

					const chunks = [];
					stream.on('data', chunk => chunks.push(chunk));
					stream.on('end', () => {
						try {
							expect(Buffer.concat(chunks).toString()).toBe(CONTENT);
							cb();
						} catch (e) {
							cb(e);
						}
					});
					stream.on('error', cb);
				});
			});
		});
	});

	describe('with validateCrc option', () => {
		it('stream emits error if CRC incorrect', (cb) => {
			getEntry(true, (err, {zipFile, entry}) => {
				zipToClose = zipFile;
				if (err) {
					cb(err);
					return;
				}

				const wrongCrc = 123;
				entry.crc32 = wrongCrc;

				zipFile.openReadStream(entry, (err, stream) => { // eslint-disable-line no-shadow
					if (err) {
						cb(err);
						return;
					}

					stream.on('data', () => {});
					stream.on('end', () => cb(new Error('Completed without error')));
					stream.on('error', (err) => { // eslint-disable-line no-shadow
						try {
							expect(err).toBeInstanceOf(Error);
							expect(err.message).toBe(`CRC32 does not match - expected ${wrongCrc}, got ${CRC}`);
							cb();
						} catch (e) {
							cb(e);
						}
					});
				});
			});
		});

		it('stream does not emit error if CRC correct', (cb) => {
			getEntry(true, (err, {zipFile, entry}) => {
				zipToClose = zipFile;
				if (err) {
					cb(err);
					return;
				}

				zipFile.openReadStream(entry, (err, stream) => { // eslint-disable-line no-shadow
					if (err) {
						cb(err);
						return;
					}

					const chunks = [];
					stream.on('data', chunk => chunks.push(chunk));
					stream.on('end', () => {
						try {
							expect(Buffer.concat(chunks).toString()).toBe(CONTENT);
							cb();
						} catch (e) {
							cb(e);
						}
					});
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
	yauzl.open(PATH, {validateCrc, autoClose: false, lazyEntries: true}, (err, zipFile) => {
		if (err) {
			cb(err);
			return;
		}

		zipFile.on('error', err => cb(err, {zipFile})); // eslint-disable-line no-shadow
		zipFile.on('entry', entry => cb(null, {zipFile, entry}));
		zipFile.readEntry();
	});
}
