// Load modules
var gulp = require('gulp');
var eslint = require('gulp-eslint');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var sourcemaps  = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

// Load data from package.json
var pkg = require('./package.json');

// The default build task
gulp.task('build', function() {
  return gulp.src('src/sortie.js')
    .pipe(sourcemaps.init())
    .pipe(eslint()) //JSCS
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(replace('<<VERSION>>', pkg.version))
    .pipe(gulp.dest('build')) // Output file
    .pipe(uglify({outSourceMap: true, preserveComments: 'license'})) // Uglify
    .pipe(rename({extname: '.min.js'})) // Rename
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('build')) // Output minified
  ;
});

gulp.task('watch', function() {
  return gulp.watch('src/sortie.js', ['build']);
});

gulp.task('default', ['build', 'watch']);
