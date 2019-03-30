'use strict';

import gulp from 'gulp';
import pug from 'gulp-pug';
import readConfig from 'read-config';
import imgRetina from 'gulp-img-retina';
import sass from 'gulp-sass';
import autoprefixer from 'gulp-autoprefixer';
import cleanCSS from 'gulp-clean-css';
import rename from 'gulp-rename';
import base64 from 'gulp-base64';
import uglify from 'gulp-uglify';
import browserSync from 'browser-sync';
import plumber from 'gulp-plumber';
import notify from 'gulp-notify';
import watch from 'gulp-watch';

const SRC = './src';
const DEST = './public';
const paths = {
    src: {
        pug: "./src/pug/**/*.pug",
        module: "./src/pug/**/_*.pug",
        scss: "./src/scss/**/*.scss",
        js: "./src/js/**/*.js",
        datauri: "./src/datauri/**/*.{png,jpg,gif,svg}",
        locale: "./src/locale/**/*.json"
    },
    public: {
        css: "./public/asset/css",
        js: "./public/asset/js",
        images: "./public/asset/images"
    }
};

const pugTask = (lang) => {
    let destDir = DEST + '/' + lang;
    if (lang === 'en') destDir = DEST + '/';

    let locals = {
        'meta': readConfig(`${SRC}/locale/meta` + `.json`),
        'header': readConfig(`${SRC}/locale/header_` + lang + `.json`),
        'home': readConfig(`${SRC}/locale/home_` + lang + `.json`),
        'about': readConfig(`${SRC}/locale/about_` + lang + `.json`),
        'concept': readConfig(`${SRC}/locale/concept_` + lang + `.json`),
        'works': readConfig(`${SRC}/locale/works_` + lang + `.json`),
        'worksItem': readConfig(`${SRC}/locale/worksItem_` + lang + `.json`),
        'contact': readConfig(`${SRC}/locale/contact_` + lang + `.json`),
        'app': readConfig(`${SRC}/locale/app_` + lang + `.json`),
        'web': readConfig(`${SRC}/locale/web_` + lang + `.json`),
        'appBusica': readConfig(`${SRC}/locale/appBusica_` + lang + `.json`),
        // 'webBusica': readConfig(`${SRC}/locale/webBusica_` + lang + `.json`),
        'webAstlanox': readConfig(`${SRC}/locale/webAstlanox_` + lang + `.json`),
        // 'appInfuse': readConfig(`${SRC}/locale/appInfuse_` + lang + `.json`)
    }
    return gulp.src(
            ['./src/pug/**/*.pug', '!./src/pug/**/_*.pug']
        )
        .pipe(
            plumber({
                errorHandler: notify.onError("Error: <%= error.message %>")
            })
        )
        .pipe(pug({
            locals: locals,
            pretty: true
        }))
        .pipe(imgRetina())
        .pipe(gulp.dest(`${destDir}`));
}

gulp.task('pug:ja', () => {
    return pugTask('ja');
});

gulp.task('pug:en', () => {
    return pugTask('en');
});

gulp.task('html', gulp.series('pug:ja', 'pug:en'));

gulp.task("css", function (done) {
    gulp
        .src(paths.src.scss)
        .pipe(
            plumber({
                errorHandler: notify.onError("Error: <%= error.message %>")
            })
        )
        .pipe(
            sass({
                outputStyle: "expanded"
            })
        )
        .pipe(
            autoprefixer({
                browsers: ["last 3 versions", "ie >= 9", "Android >= 4", "ios_saf >= 8"]
            })
        )
        .pipe(base64({
            baseDir: 'public',
            extensions: ['svg', 'png', 'gif', /\.jpg#datauri$/i],
            maxImageSize: 8 * 1024
        }))
        .pipe(gulp.dest(paths.public.css))
        .pipe(cleanCSS())
        .pipe(
            rename({
                suffix: ".min"
            })
        )
        .pipe(gulp.dest(paths.public.css));
    done();
});

gulp.task("javascript", function (done) {
    return gulp
        .src(paths.src.js)
        .pipe(uglify())
        .pipe(
            rename({
                suffix: ".min"
            })
        )
        .pipe(gulp.dest(paths.public.js));
    done();
});

gulp.task("image", function () {
    return gulp
        .src(paths.src.datauri)
        .pipe(gulp.dest(paths.public.images));
});

gulp.task('browser-sync', () => {
    browserSync({
        server: {
            baseDir: DEST
        }
    });
    watch([
        paths.src.pug,
        paths.src.scss,
        paths.src.js,
        paths.src.datauri,
        paths.src.locale
    ], gulp.series('html', 'css', 'javascript', 'image',
        browserSync.reload));
});

gulp.task('build', gulp.series('html', 'css', 'javascript', 'image'));
gulp.task('serve', gulp.series('browser-sync'));
gulp.task('default', gulp.series('build', 'serve'));