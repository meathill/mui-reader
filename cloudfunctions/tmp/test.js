const {uniqueId} = require('lodash');

const API = 'https://aai.tencentcloudapi.com/?Action=TextToVoice';
const Version = '2018-05-22';
const Region = 'ap-beijing';
const SessionId = uniqueId('session-');
const ModelType = 1;
const Volume = 7;
const Speed =1;
const VoiceType = 1;
const Text = '你好，我们是趴窝团队';

// 公共参数
const Action = 'TextToVoice';
const Timestamp = Date.now() / 1000;
const Nonce = 'helloworld';
const SecretId = 'AKID7C4j9KhyR8ex1wj4HMJ6h4C5i8JKupEV';

// 生成签名原文
const source = 'POSTaai.tencentcloudapi.com/?param_a=0&param_b=1&param_c=2\n'
const Signature = '';
