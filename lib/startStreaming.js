var EventSource = require("eventsource");

// This API will emit events from this URL.
var NEST_API_URL = "https://developer-api.nest.com";

exports.startStreaming = function(token, socket, publish) {
  var headers = {
    Authorization: "Bearer " + token
  };
  var source = new EventSource(NEST_API_URL, { headers: headers });

  source.addEventListener("put", function(e) {
    console.log("Put:");
    // console.log(e.data + "\n");
    if (socket) {
      console.log("publishing to socket");
      socket.emit("event", e.data);
    }
    if (publish) {
      publish(e.data);
    }
  });

  source.addEventListener("open", function(e) {
    console.log("Connection opened!");
  });

  source.addEventListener("auth_revoked", function(e) {
    console.log("Authentication token was revoked.");
    // Re-authenticate your user here.
  });

  source.addEventListener(
    "error",
    function(e) {
      if (e.readyState == EventSource.CLOSED) {
        console.error("Connection was closed! ", e);
      } else {
        console.error("An unknown error occurred: ", e);
      }
    },
    false
  );
};
