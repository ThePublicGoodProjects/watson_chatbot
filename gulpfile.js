'use strict';

const
    AUTOPREFIXER_BROWSERS = [
        'ie >= 10',
        'ie_mob >= 10',
        'ff >= 30',
        'chrome >= 34',
        'safari >= 7',
        'opera >= 23',
        'ios >= 7',
        'android >= 4.4',
        'bb >= 10'
    ],
    gulp                  = require('gulp'),
    sass                  = require('gulp-sass'),
    csso                  = require('gulp-csso'),
    util                  = require('gulp-util'),
    uglify                = require('gulp-uglify'),
    htmlmin               = require('gulp-htmlmin'),
    concat                = require('gulp-concat'),
    autoprefixer          = require('gulp-autoprefixer'),
    config                = {
        production: !!util.env.production || !!util.env.prod
    };

gulp.task('sass', function () {
    return gulp.src('./src/sass/app.scss')
        .pipe(sass({
            includePaths: ['node_modules']
        }).on('error', sass.logError))
        .pipe(autoprefixer({browsers: AUTOPREFIXER_BROWSERS}))
        .pipe(config.production ? csso() : csso({
            restructure: false,
            sourceMap: true,
            debug: true
        }))
        .pipe(gulp.dest('./public/css'));
});

gulp.task('scripts', function () {
    return gulp.src(['./src/**/*.js'])
        .pipe(config.production ? uglify('app.js') : concat('app.js'))
        .pipe(gulp.dest('./public/js'));
});

gulp.task('pages', function () {
    return gulp.src(['./src/pages/*.html'])
        .pipe(config.production ? htmlmin({
            collapseWhitespace: true,
            removeComments    : true
        }) : util.noop())
        .pipe(gulp.dest('./public'));
});

gulp.task('watch', function () {
    gulp.watch('./src/sass/**/*.scss', gulp.series('sass'));
    gulp.watch('./src/js/**/*.js', gulp.series('scripts'));
    gulp.watch('./src/pages/**/*.html', gulp.series('pages'));
});

gulp.task('default', gulp.series('scripts', 'sass', 'pages'));
gulp.task('watch', gulp.series('default', 'watch'));

