/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var http = require("http");
var path = require("path");

var express = require("express");
var ioserver = require("socket.io");
var bodyParser = require("body-parser");
var passport = require("passport");
var NestStrategy = require("passport-nest").Strategy;
var session = require("express-session");
var EventSource = require("eventsource");
var openurl = require("openurl");
require("dotenv").config();
var cors = require("cors");
var axios = require("axios");

const AWS = require("aws-sdk");
const publishToAws = require("./publishToAws").publishToAws;

// Change for production apps.
// This secret is used to sign session ID cookies.
var SUPER_SECRET_KEY = "keyboard-cat";

// This API will emit events from this URL.
var NEST_API_URL = "https://developer-api.nest.com";

// PassportJS options. See http://passportjs.org/docs for more information.
var passportOptions = {
  failureRedirect: "/auth/failure" // Redirect to another page on failure.
};

AWS.config.region = "eu-central-1";
AWS.config.credentials = new AWS.Credentials(
  process.env.AWS_CLIENT_ID,
  process.env.AWS_SECRET_CLIENT_KEY
);

passport.use(
  new NestStrategy({
    // Read credentials from your environment variables.
    clientID: process.env.NEST_ID,
    clientSecret: process.env.NEST_SECRET
  })
);

/**
 * No user data is available in the Nest OAuth
 * service, just return the empty user objects.
 */
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

/**
 * Start REST Streaming device events given a Nest token.
 */
function startStreaming(token, socket) {
  var headers = {
    Authorization: "Bearer " + token
  };
  var source = new EventSource(NEST_API_URL, { headers: headers });

  source.addEventListener("put", function(e) {
    console.log("Put:");
    // console.log(e.data + "\n");
    if (socket) {
      socket.emit("event", e.data);
    }
    publishToAws(e.data);
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
}

var app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({
    secret: SUPER_SECRET_KEY,
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());

/**
 * Listen for calls and redirect the user to the Nest OAuth
 * URL with the correct parameters.
 */
app.get("/auth/nest", passport.authenticate("nest", passportOptions), function(
  req,
  res
) {
  res.redirect;
});

/**
 * Upon return from the Nest OAuth endpoint, grab the user's
 * accessToken and start streaming the events.
 */
app.post("/auth/nest/callback", function(req, res) {
  console.log(req.body.code);
  axios.default
    .post(
      `https://6p34vflxac.execute-api.eu-central-1.amazonaws.com/default/hack-auth-lambda?authCode=${
        req.body.code
      }`
    )
    .then(response => {
      let { token } = response.data;
      res.send({ token });
    })
    .catch(err => {
      console.log(err);
      res.end();
    });
});

/**
 * When authentication fails, present the user with
 * an error requesting they try the request again.
 */
app.get("/auth/failure", function(req, res) {
  res.send("Authentication failed. Please try again.");
});

app.get("/events", function(req, res) {
  const token = req.params.token;
  console.log("reading events" + token);
});

app.get("/hello", function(req, res) {
  console.log("world");
  res.data = "world";
  res.send("world");
});

app.post("/events", function(req, res) {
  const token = req.params.token;
  console.log("recording events started for token: " + token);
});

/**
 * Get port from environment and store in Express.
 */
var port = process.env.PORT || 3000;
app.set("port", port);

/**
 * Create HTTP server.
 */
var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

const io = ioserver(server);
console.log("websocket: start");
io.on("connection", function(socket) {
  console.log("someone connected");
  startStreaming(
    "c.xBfzes6WfcfmuoY1Ahjoy7sOncXhdOzZb4go5kyMsku1XjqMT1BlQU3rxDFmKjB7ni0ZNFTApUINItmQ11wtQ6YQFnJUXfa4YarRphWEjrogr6S1mDKMM8hVL49zqtiXYGKi6W92d5O3JiN0",
    socket
  );
});

server.listen(port);

startStreaming(
  "c.xBfzes6WfcfmuoY1Ahjoy7sOncXhdOzZb4go5kyMsku1XjqMT1BlQU3rxDFmKjB7ni0ZNFTApUINItmQ11wtQ6YQFnJUXfa4YarRphWEjrogr6S1mDKMM8hVL49zqtiXYGKi6W92d5O3JiN0"
);
