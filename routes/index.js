/**
 * Created by xuan on 17-5-15.
 */
"use strict";
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
module.exports = router;
router.PATH = "/";

let files = fs.readdirSync(__dirname);
files.forEach(function (f) {
    let fullpath = path.join(__dirname, f);
    if (fullpath === __filename) {
        return;
    }
    let name = path.basename(f, ".js");
    router.use("/" + name, require(fullpath));
});
