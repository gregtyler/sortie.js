// Load modules
const gulp = require('gulp');
const jscs = require('gulp-jscs');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const sourcemaps  = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');

// Load data from package.json
var pkg = require('./package.json');

// The default build task
gulp.task('default', function() {
  return gulp.src('src/sortie.js')
    .pipe(sourcemaps.init())
    .pipe(jscs()) //JSCS
    .pipe(jscs.reporter())
    .pipe(replace('<<VERSION>>', pkg.version))
    .pipe(gulp.dest('build')) // Output file
    .pipe(uglify({outSourceMap: true, preserveComments: 'license'})) // Uglify
    .pipe(rename({extname: '.min.js'})) // Rename
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('build')) // Output minified
  ;
});
