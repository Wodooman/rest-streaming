const handyRedis = require("handy-redis");

const client = handyRedis.createHandyClient(
  "redis://h:p0783db751c4bca3368107fca385e977c55a9522c598f1b14c8d250000446e9c3@ec2-63-35-33-111.eu-west-1.compute.amazonaws.com:11699"
);

exports.saveToRedis = async function(event) {
  const object = JSON.parse(event);
  const cameras = object.data.devices.cameras;
  const cameraId = Object.keys(cameras)[0];
  const camera = cameras[cameraId];

  const dataToStore = {
    name: camera.name,
    device_id: camera.device_id,
    is_online: camera.is_online,
    is_streaming: camera.is_streaming,
    is_audio_input_enabled: camera.is_audio_input_enabled,
    last_is_online_change: camera.last_is_online_change,
    is_video_history_enabled: camera.is_video_history_enabled,
    is_public_share_enabled: camera.is_public_share_enabled,
    last_event: {
      has_sound: camera.last_event.has_sound,
      has_motion: camera.last_event.has_motion,
      has_person: camera.last_event.has_person,
      start_time: camera.last_event.start_time,
      urls_expire_time: camera.last_event.urls_expire_time,
      web_url: camera.last_event.web_url,
      app_url: camera.last_event.app_url,
      image_url: camera.last_event.image_url,
      animated_image_url: camera.last_event.animated_image_url
    }
  };
  client
    .set(dataToStore.last_event.start_time, JSON.stringify(dataToStore))
    .then(() => console.log("saved to redis"))
    .then(() => console.log(dataToStore));
};

exports.getAll = async function() {
  const keys = await client.keys("*");
  const valuesPromises = keys.map(k => client.get(k).then(r => JSON.parse(r)));
  return Promise.all(valuesPromises);
};
