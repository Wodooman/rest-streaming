"use strict";

const EventSource = require("eventsource");
const Axios = require("axios");
const NEST_API_URL = "https://developer-api.nest.com";

var token = `c.FqhlZVg70IgYbjev3wYMAz85ew7B9Jw3nYPfJzlAF7pPiWri51VC8xZVATfFf1PjMmRw9Y0EMdlO4BN9QJaYvl2yliZb5IxCg0ghwY02YASknzwpCoKSzRij4KI595nKftMK8buwRNnuOdA5`;
// Update with your token
startStreaming(token);
/**
 * Start REST streaming device events given a Nest token.
 */

function startStreaming(token) {
  var headers = {
    Authorization: "Bearer " + token
  };
  var source = new EventSource(NEST_API_URL, { headers: headers });

  source.addEventListener("put", function(event) {
    return event.data;
  });

  source.addEventListener("open", function(event) {
    console.log("Connection opened!");
  });

  source.addEventListener("auth_revoked", function(event) {
    console.log("Authentication token was revoked.");
    // Re-authenticate your user here.
  });

  source.addEventListener(
    "error",
    function(event) {
      if (event.readyState == EventSource.CLOSED) {
        console.error("Connection was closed!", event);
      } else {
        console.error("An unknown error occurred: ", event);
      }
    },
    false
  );
}
