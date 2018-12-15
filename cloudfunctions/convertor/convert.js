const tencentcloud = require("tencentcloud-sdk-nodejs");
const {uniqueId} = require('lodash');
const {APP_ID, APP_SECRET} = require('./config');

const AaiClient = tencentcloud.aai.v20180522.Client;
const models = tencentcloud.aai.v20180522.Models;

const Credential = tencentcloud.common.Credential;
const ClientProfile = tencentcloud.common.ClientProfile;
const HttpProfile = tencentcloud.common.HttpProfile;

let cred = new Credential(APP_ID, APP_SECRET);
let httpProfile = new HttpProfile();
httpProfile.endpoint = "aai.tencentcloudapi.com";
let clientProfile = new ClientProfile();
clientProfile.httpProfile = httpProfile;
let client = new AaiClient(cred, "ap-beijing", clientProfile);

module.exports = (text) => {
  console.log('start TTS: ', text);
  const sessionId = uniqueId('mui-');
  const req = new models.TextToVoiceRequest();
  text = decodeURIComponent(text);
  const params = `{"Text":"${text}","SessionId":"${sessionId}","ModelType":1}`;
  req.from_json_string(params);

  return new Promise((resolve, reject) => {
    client.TextToVoice(req, async function(errMsg, response) {
      if (errMsg) {
        reject(errMsg);
        return;
      }

      const {Audio} = response;
      resolve(Audio);
      console.log('TTS ok');
    });
  });
};
