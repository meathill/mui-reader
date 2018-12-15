const fs = require('fs');
const {promisify} = require('util');
const axios = require('axios');
const cheerio = require('cheerio');
const {map} = require('lodash');
const convert = require('./convert');

const writeFile = promisify(fs.writeFile);

(async function () {
  const url = 'https://mp.weixin.qq.com/s?__biz=MzA5NDIwNTg2Mg==&mid=2708982839&idx=1&sn=b83d40c9469d94edb78ab1351249fa2b&chksm=b4d14efe83a6c7e89ed85835d2627990a2f2fff54d177bd602d970cf39734da0d044e5c5e4ef&mpshare=1&scene=1&srcid=1214PtyFMXnkDKOsbpQu8fYb&pass_ticket=uPmYpRNVxYZqBvxX%2FrGnABMBzUvFml%2BhdqEEAGNHjMk%3D#rd';
  const content = await axios.get(url);

  const $ = cheerio.load(content.data, {
    decodeEntities: false,
  });

  const title = $('#page-content h2').text();
  let paragraph = $('#page-content p').map(function () {
    return $(this).text();
  }).get();

  paragraph.unshift(title);
  paragraph = paragraph.filter(item => !!item)
    .map(item => item.trim().replace(/[\n\r]/g, ''));

  const audios = [];
  for (const text of paragraph) {
    const audio = await convert(text);
    audios.push(audio);
  }

  console.log('开始写入文件');
  await writeFile('test.mp3', audios.join(''), {
    encoding: 'base64',
  });
  console.log('写入完成');
})();



