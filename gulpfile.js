const gulp = require('gulp');
const jscs = require('gulp-jscs');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');

gulp.task('default', function() {
  var file = gulp.src('src/sortie.js')
    .pipe(jscs()) //JSCS
    .pipe(jscs.reporter())
    .pipe(gulp.dest('build')) // Output file
    .pipe(uglify({preserveComments: 'license'})) // Uglify
    .pipe(rename({extname: '.min.js'})) // Rename
    .pipe(gulp.dest('build')) // Output minified
  ;
});