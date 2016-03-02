// Load modules
const gulp = require('gulp');
const jscs = require('gulp-jscs');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const sourcemaps  = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');

// Load data from package.json
var pkg = require('./package.json');

// Error handling
function handleError(err) {
  console.error(err.message);
  this.emit('end');
}

// The default build task
gulp.task('build', function() {
  return gulp.src('src/sortie.js')
    .pipe(sourcemaps.init())
    .pipe(jscs()) // JSCS
    .pipe(jscs.reporter())
    .pipe(replace('<<VERSION>>', pkg.version))
    .pipe(gulp.dest('build')) // Output file
    .pipe(uglify({outSourceMap: true, preserveComments: 'license'}).on('error', handleError)) // Uglify
    .pipe(rename({extname: '.min.js'})) // Rename
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('build')) // Output minified
  ;
});

gulp.task('watch', function() {
  gulp.watch('src/sortie.js', ['build']);
});

gulp.task('default', ['build', 'watch']);
