const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const concatStream  = require('mp3-concat');
const Readable = require('stream').Readable;

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const source = path.resolve(process.cwd(), 'base64.txt');

(async function () {
  const content = await readFile(source, 'utf8');
  const parts = content.split('\n\n\n');

  let index = 0;
  for (const part of parts) {
    await writeFile(`part${index}.wav`, part, {
      encoding: 'base64',
    });
    index++;
  }
})();
