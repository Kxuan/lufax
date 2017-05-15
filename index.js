/**
 * Created by xuan on 17-5-15.
 */
"use strict";

const path = require("path");

const cookieParser=require("cookie-parser");
const express = require('express');
const app = express();

app.use(express.static('public'));
app.use(cookieParser());
app.use("/", require("./routes"));

app.listen(3000, function () {
    console.log('Example app listening on port http://localhost:3000')
});