var redis = require("redis");
var dbutil = require('./dbutil');
var connection = dbutil.getMysqlConnection();
var pool = dbutil.getMysqlPoll();
var express = require('express');
var History = require("./History");
var app = express();
var pidutil = require("./pidutil.js")
require("./excel")
app.get("/reboot", function () {
    pidutil.rebootServer()
})
function run() {
    pidutil.killLastPid();
    pidutil.savePid();
    setTimeout(function () {
        var server = app.listen(1888, function (err) {
            if (err) {
                throw err;
            }
            dbutil.clearKeysDevices(connection, function () {
                var arr = dbutil.getListenIps();
                for (var i = 0; i < arr.length; i++) {
                    dbutil.startRedisLinsten(redis, arr[i])
                }
            })
            History.run();
        })
    }, 3000)
}
exports.run=run;