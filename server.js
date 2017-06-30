var express = require('express');
var app = express();
var dbutil = require("./dbutil")
var pool = dbutil.getMysqlPoll();
console.log(pool)
app.all('/', function (req, res) {

    pool.query("select * from smartio_data_record limit 0,25", function (err, results) {
        console.log(JSON.stringify(results))
        res.send(JSON.stringify(results));
    })
})

var server = app.listen(1888, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("应用实例，访问地址为 http://%s:%s", host, port)
})