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
var openurl = require("openurl");
require("dotenv").config();
var cors = require("cors");
var axios = require("axios");

const AWS = require("aws-sdk");
const publishToAws = require("./lib/publishToAws").publishToAws;
const startStreaming = require("./lib/startStreaming").startStreaming;
const saveToRedis = require("./lib/redis").saveToRedis;
const getAll = require("./lib/redis").getAll;

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

var app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SESSIOM_SECRET_KEY,
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
    .post(`${process.env.LAMBDA_AUTH_URL}?authCode=${req.body.code}`)
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

app.get("/events", async function(req, res) {
  const events = await getAll();
  res.send(events);
});

app.get("/hello", function(req, res) {
  console.log("world");
  res.send("world");
});

/**
 * Get port from environment and store in Express.
 */
var port = process.env.PORT || 4000;
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
  startStreaming(process.env.NEST_ACCESS_TOKEN, socket);
});

server.listen(port);

// startStreaming(process.env.NEST_ACCESS_TOKEN, null, publishToAws, saveToRedis);
