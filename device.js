const deviceModule = require("aws-iot-device-sdk").device;
const config = require("./deviceConfig").config;

exports.publish = function(event) {
  const device = deviceModule({
    keyPath: config.privateKey,
    certPath: config.clientCert,
    caPath: config.caCert,
    clientId: config.clientId,
    region: config.region,
    baseReconnectTimeMs: config.reconnectPeriod,
    keepalive: true,
    host: config.hostName
  });

  device.publish("Camera", JSON.stringify(event));
};
