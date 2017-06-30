var redis = require("redis");
var redisClient = redis.createClient();
var redisClientSub = redis.createClient();
var dbutil = require('./dbutil');

var connection = dbutil.getMysqlConnection();
var pool = dbutil.getMysqlPoll();

dbutil.clearKeysDevices(connection, function () {
    dbutil.initMysqlData(redisClient, connection, function (err) {
        redisClientSub.psubscribe("*");
        redisClientSub.on("pmessage", function (pattern, channel, message) {
            var host = this.connection_options.host + "";
            var port = this.connection_options.port;
            var msArr = message.split("\r\n");
            if (msArr[1] == "Present_Value") {
                dbutil.saveSubscribeMessage(pool, host, port, msArr, function () {
                })
            }
        })
    })
})
