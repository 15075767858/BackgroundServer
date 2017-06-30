var express = require('express');
var app = express();
var dbutil = require("./dbutil")
var pool = dbutil.getMysqlPoll();

app.get('/', function (req, res) {
    
    // pool.query("select * form smartio_key",function(){
    //     console.log(arguments)
    // })
   res.send('Hello World');
})

var server = app.listen(1888, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("应用实例，访问地址为 http://%s:%s", host, port)
})