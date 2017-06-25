#!/usr/bin/env nodejs

"use strict";

const path = require("path");
const fs = require("fs");

global.config = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "config.json")).toString());

const Spider = require("../lu/spider");
global.spider = new Spider();
console.log("Spider is working...");
