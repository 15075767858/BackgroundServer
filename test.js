// var redis = require("redis");


// var client = redis.createClient({
//     host: "127.0.0.2",
// })
// client.on("error",function(err){
//     console.log("err")
//     console.log(err)
// })
// var client1 = redis.createClient({
//     host: "127.0.0.1",
// })
// // setTimeout(function(){
// // client.quit()
// // },5000)


var excel =  require("./excel")
excel.saveAllExcel()