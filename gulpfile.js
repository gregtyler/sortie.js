const gulp = require('gulp');
const jscs = require('gulp-jscs');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const uglify = require('gulp-uglify');

var pkg = require('./package.json');

gulp.task('default', function() {
  return gulp.src('src/sortie.js')
    .pipe(jscs()) //JSCS
    .pipe(jscs.reporter())
    .pipe(replace('<<VERSION>>', pkg.version))
    .pipe(gulp.dest('build')) // Output file
    .pipe(uglify({preserveComments: 'license'})) // Uglify
    .pipe(rename({extname: '.min.js'})) // Rename
    .pipe(gulp.dest('build')) // Output minified
  ;
});