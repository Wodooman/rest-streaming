const deviceModule = require("aws-iot-device-sdk").device;
const config = require("./deviceConfig").config;

exports.createDevice = function() {
  const device = deviceModule({
    keyPath: config.privateKey,
    certPath: config.clientCert,
    caPath: config.caCert,
    clientId: config.clientId,
    region: config.region,
    baseReconnectTimeMs: config.reconnectPeriod,
    host: config.hostName
  });

  return device;
};
