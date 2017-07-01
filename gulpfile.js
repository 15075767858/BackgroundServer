const path = require('path');
var dest = __dirname;
var sources = "/Volumes/XiaoMi-usb0/共享/".path.basename(__dirname);
var gulp = require('gulp'),
    fileSync = require('gulp-file-sync');
gulp.task('file', function () {
    gulp.watch([dest + '/**/**'], function () {
        console.log(arguments)
        var pbarr = [".vscode", "gulpfile.js", ".DS_Store", "._.DS_Store", ".git", "modbus-tcp-server", "libevent", "library"]
        fileSync(dest, sources, { recursive: true, ignore: pbarr });
    });
});
