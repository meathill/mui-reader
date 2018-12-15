const tencentcloud = require("tencentcloud-sdk-nodejs");

/* global TENCENT_CLOUD_API_ID, TENCENT_CLOUD_API_SECRET */

const AaiClient = tencentcloud.aai.v20180522.Client;
const models = tencentcloud.aai.v20180522.Models;

const Credential = tencentcloud.common.Credential;
const ClientProfile = tencentcloud.common.ClientProfile;
const HttpProfile = tencentcloud.common.HttpProfile;

console.log(process.env.TENCENT_CLOUD_API_ID, process.env.TENCENT_CLOUD_API_SECRET);
let cred = new Credential(process.env.TENCENT_CLOUD_API_ID, process.env.TENCENT_CLOUD_API_SECRET);
let httpProfile = new HttpProfile();
httpProfile.endpoint = "aai.tencentcloudapi.com";
let clientProfile = new ClientProfile();
clientProfile.httpProfile = httpProfile;
let client = new AaiClient(cred, "ap-beijing", clientProfile);

module.exports = (sessionId, text) => {
  console.log('start TTS: ', text);
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
