// Creates two zip archives at the project root:
//  - bank-proxy.zip (Option A)
//  - bank-proxy-with-demo.zip (Option B)
// Uses archiver to avoid requiring system zip tools.

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const root = path.resolve(__dirname, '../../..');
const projectRoot = root; // D:\Projects (in this repo layout)

async function zipOptionA() {
  const outPath = path.join(projectRoot, 'bank-proxy.zip');
  const output = fs.createWriteStream(outPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(output);

  const baseDir = path.resolve(__dirname);
  archive.directory(baseDir + path.sep, 'minimal-bank-proxy');

  await archive.finalize();
  return outPath;
}

async function zipOptionB() {
  const outPath = path.join(projectRoot, 'bank-proxy-with-demo.zip');
  const output = fs.createWriteStream(outPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(output);

  const baseDir = path.resolve(__dirname);
  archive.directory(baseDir + path.sep, 'minimal-bank-proxy');

  // Add demo data files preserving repo-relative structure
  const dataStoreSrc = path.resolve(__dirname, '../lib/dataStore.js').replace(/\\/g, '/');
  const dbJsonSrc = path.resolve(__dirname, '../data/db.json').replace(/\\/g, '/');
  archive.file(dataStoreSrc, { name: 'teller-phase5-codex/lib/dataStore.js' });
  archive.file(dbJsonSrc, { name: 'teller-phase5-codex/data/db.json' });

  await archive.finalize();
  return outPath;
}

(async () => {
  try {
    const a = await zipOptionA();
    const b = await zipOptionB();
    console.log('Created:', a);
    console.log('Created:', b);
  } catch (e) {
    console.error('Zip creation failed:', e);
    process.exit(1);
  }
})();

