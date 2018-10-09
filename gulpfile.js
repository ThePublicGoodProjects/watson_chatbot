'use strict';

var gulp   = require('gulp'),
    sass   = require('gulp-sass'),
    concat = require('gulp-concat');

gulp.task('sass', function () {
    return gulp.src('./src/sass/app.scss')
        .pipe(sass({
            includePaths: ['node_modules']
        }).on('error', sass.logError))
        .pipe(gulp.dest('./public/css'));
});

gulp.task('concat', function () {
    gulp.src([
        './src/js/common.js',
        './src/js/api.js',
        './src/js/conversation.js',
        './src/js/global.js'
    ])
        .pipe(concat('app.js'))
        .pipe(gulp.dest('./public/js'));
});

gulp.task('watch', function () {
    gulp.watch('./src/sass/**/*.scss', ['sass']);
    gulp.watch('./src/js/**/*.js', ['concat']);
});

gulp.task('default', ['concat', 'sass', 'watch']);

