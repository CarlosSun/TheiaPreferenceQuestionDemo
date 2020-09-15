// @ts-check
const gulp = require('gulp');
const serverDir = './src/common/i18n/';
const extensionDir = 'lib/common/i18n';

gulp.task('copy_i18n_files', done => {
    gulp.src(serverDir + '*.json')
        .pipe(gulp.dest(extensionDir));
        done();
});





