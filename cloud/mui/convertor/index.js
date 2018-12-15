const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const AV = require('leanengine');
const axios = require('axios');
const cheerio = require('cheerio');
const del = require('del');
const {flatten} = require('lodash');
const convert = require('./convert');
const {generateRandomString} = require("../helper/util");
const spawn = require('../helper/spawn');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

module.exports = function (url) {
  const startTime = Date.now();
  let length;
  let total = 0;
  let sessionId = generateRandomString(12);
  return axios.get(url)
    .then(content => {
      return cheerio.load(content.data, {
        decodeEntities: false,
      });
    })
    .then($ => {
      const title = $('#page-content h2').text();
      let paragraph = $('#page-content p').map(function () {
        return $(this).text();
      }).get();

      let total = 0;
      paragraph.unshift(title);
      paragraph = paragraph.filter(item => !!item)
        .map(item => {
          item = item.trim().replace(/[\n\r]/g, '');
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
      return flatten(paragraph);
    })
    .then(paragraph => {
      length = paragraph.length;
      return paragraph.reduce((promise, line, index) => {
        total += line.length;
        return promise
          .then(() => {
            console.log('TTS: ', line);
            return convert(sessionId, line);
          })
          .then(audio => {
            const filename = `${sessionId}-${index}.wav`;
            console.log('TTS ok. Write into: ', filename);
            return writeFile(filename, audio, {
              encoding: 'base64',
            });
          });
      }, Promise.resolve());
    })
    .then(() => {
      let fileList = [];
      for (let i = 0; i < length; i++) {
        const file = path.resolve(process.cwd(), `${sessionId}-${i}.wav`);
        fileList.push(`file ${file}`);
      }
      console.log('Output file list.');
      return writeFile('file.txt', fileList.join('\n'), 'utf8');
    })
    // 把所有 wav 合并成一个
    .then(() => {
      const cmd = 'ffmpeg';
      const args = [
        '-f', 'concat',
        '-safe', '0',
        '-i', 'file.txt',
        '-c', 'copy',
        'out.wav',
      ];
      return spawn(cmd, args);
    })
    // 把 out.wav 转换成 out.mp3，并存入存储
    .then(() => {
      const cmd = 'ffmpeg';
      const args = [
        '-i', 'out.wav',
        'out.mp3',
      ];
      return spawn(cmd, args);
    })
    // 上传 mp3 到存储
    .then(() => {
      return readFile('out.mp3', {
        encoding: 'base64',
      });
    })
    .then(base64 => {
      const file = new AV.File(`${sessionId}.mp3`, {
        base64,
      });
      return file.save();
    })
    // 删掉中间文件
    .then(file => {
      return Promise.all([
        file,
        del(['*.mp3', '*.wav', 'file.txt']),
      ]);
    })
    .then(([file]) => {
      console.log(`转换成功。共：${total} 字，耗时：${Math.round((Date.now() - startTime) / 1000)}s`);
      return file;
    })
    .catch(console.error);
};
