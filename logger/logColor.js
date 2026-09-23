"use strict";
const { colors } = require('./colors.js');
module.exports = (color, message) => console.log(colors.bold.white(colors.hex(color, message)));
