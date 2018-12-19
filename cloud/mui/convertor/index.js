const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const AV = require('leanengine');
const axios = require('axios');
const cheerio = require('cheerio');
const del = require('del');
const {flatten} = require('lodash');
const convert = require('./convert');
const spawn = require('../helper/spawn');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const appendFile = promisify(fs.appendFile);
const {existsSync} = fs;

function clean(str) {
  return str.trim()
    .replace(/[\n\r]/g, '')
    .replace(/^\s$/, '');
}
function extractExcerpt(array) {
  let count = 0;
  let excerpt = '';
  let index = 0;
  while (count < 2) {
    if (array[index]) {
      excerpt += array[index];
      count ++;
    }
    index ++;
  }
  return excerpt;
}

module.exports = {
  async toMP3(sessionId, line, index) {
    console.log('TTS: ', line);
    const audio = await convert(sessionId, line);
    const filename = `${sessionId}-${index}.wav`;
    console.log('TTS ok. Write into: ', filename);
    await writeFile(filename, audio, {
      encoding: 'base64',
    });
    const file = path.resolve(process.cwd(), filename);
    await appendFile(`${sessionId}.txt`, `file ${file}\n`, 'utf8');
  },
  // 合并成一个 MP3 并上传
  async mergeMP3(sessionId) {
    const mp3 = `${sessionId}.mp3`;
    if (!existsSync(path.resolve(process.cwd(), mp3))) {
      console.log('Start to create file.');
      const cmd = 'ffmpeg';
      let args = [
        '-f', 'concat',
        '-safe', '0',
        '-i', `${sessionId}.txt`,
        '-c', 'copy',
        '-y',
        `${sessionId}.wav`,
      ];
      await spawn(cmd, args);
      console.log('wav merged.');

      // 转换 mp3
      args = [
        '-i', `${sessionId}.wav`,
        `${sessionId}.mp3`,
      ];
      await spawn(cmd, args);
    }
    console.log('mp3 created.');

    // 上传
    const base64 = await readFile(`${sessionId}.mp3`, {
      encoding: 'base64',
    });
    const file = new AV.File(`${sessionId}.mp3`, {
      base64,
    });
    await file.save();
    await del([`${sessionId}.mp3`, `${sessionId}*.wav`, `${sessionId}.txt`]);
    console.log('Converted: ', file.id);
    return file;
  },
  async capture(url) {
    const content = await axios.get(url);
    const $ = cheerio.load(content.data, {
      decodeEntities: false,
    });
    const title = clean($('#page-content h2').text());
    let paragraph = $('#page-content p').map(function () {
      return $(this).text();
    }).get();
    let total = 0;
    paragraph = paragraph.map(clean)
      .filter(item => !!item)
      .map(item => {
        total += item.length;
        if (item.length <= 100) {
          return item;
        }

        const reg = /[，。]/g;
        const split = [];
        let result;
        let start = 0;
        let last = 0;
        while ((result = reg.exec(item)) !== null) {
          const {index} = result;
          if (index + 1 - start > 100) {
            split.push(item.substring(start, last + 1));
            start = last + 1;
          }
          last = index;
        }
        split.push(item.substring(start));
        return split;
      });
    paragraph = flatten(paragraph);
    const excerpt = extractExcerpt(paragraph);
    paragraph.unshift(title);
    return {
      title,
      excerpt,
      paragraph,
    };
  },
};
