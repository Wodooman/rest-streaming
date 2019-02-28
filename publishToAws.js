var AWS = require("aws-sdk");

exports.publishToAws = function(message) {
  var iotdata = new AWS.IotData({
    endpoint: "a3phhs2xnbo0m1-ats.iot.eu-central-1.amazonaws.com"
  });

  var params = {
    topic: "Nest-Camera",
    payload: message,
    qos: 0
  };

  return iotdata.publish(params, function(err, data) {
    if (err) {
      console.log(err);
    } else {
      console.log("Success, I guess.");
      //context.succeed();
    }
  });
};
