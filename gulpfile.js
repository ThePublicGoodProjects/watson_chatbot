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
    return gulp.src([
        './src/js/common.js',
        './src/js/api.js',
        './src/js/conversation.js',
        './src/js/global.js'
    ])
        .pipe(concat('app.js'))
        .pipe(gulp.dest('./public/js'));
});

gulp.task('watch', function () {
    gulp.watch('./src/sass/**/*.scss', gulp.series('sass'));
    gulp.watch('./src/js/**/*.js', gulp.series('concat'));
});

gulp.task('default', gulp.series('concat', 'sass', 'watch'));

