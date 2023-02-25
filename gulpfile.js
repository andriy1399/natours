const gulp = require('gulp');
const copy = require('gulp-copy');

gulp.task('copy-templates', function () {
  return gulp.src('src/email-templates/*.pug')
    .pipe(copy('dist/email-templates', { prefix: 2 }));
});

gulp.task('default', gulp.series('copy-templates'));
