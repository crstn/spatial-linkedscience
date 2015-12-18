// Shared Dependencies
var gulp = require('gulp');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
// html task
var jade = require('gulp-jade');
// styles task
var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
// javascript task
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var eslint = require('gulp-eslint');
// sync task
var browserSync = require('browser-sync');
var reload = browserSync.reload;

// On error
function onError(error) {
  gutil.beep();
  gutil.log(gutil.colors.red(error.message));
  this.emit('end');
}

// HTML Task
// Compiles Jade to HTML
gulp.task('html', function () {
  gulp.src('dev/*.jade')
    .pipe(plumber(onError))
    .pipe(jade({
      pretty: true
    }))
    .pipe(gulp.dest(''))
    .pipe(reload({
      stream: true
    }));
});

// Styles Task
// Compiles Sass to CSS
gulp.task('styles', function () {
  return gulp.src('dev/css/main.scss')
    .pipe(plumber(onError))
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(postcss([
      // require('stylelint')(config.stylelint),
      // require('precss')(),
      require('autoprefixer')({ browsers: ['last 2 versions'] })
    ]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('assets/css'))
    .pipe(reload({
      stream: true
    }));
});

// Javascript Task
gulp.task('javascript', function () {
  return gulp.src('dev/js/*.js')
    .pipe(plumber(onError))
    .pipe(sourcemaps.init())
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(babel())
      .pipe(concat('bundle.js'))
      //.pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./assets/js'))
    .pipe(reload({
      stream: true
    }));
});

// Sync Task
// runs browser-sync
gulp.task('sync-proxy', function () {
  browserSync({
    proxy: '127.0.0.1:80',
    online: true,
    notify: false
  });
});

// Sync Task
// runs browser-sync
gulp.task('sync-noproxy', function () {
  browserSync({
    server: {
      baseDir: './'
    },
    online: false,
    notify: false
  });
});

// Watch Task
// Watches Jade, Sass, Javascript
gulp.task('watch', function () {
  gulp.watch('dev/**/*.jade', ['html']);
  gulp.watch('dev/js/*.js', ['javascript']);
  gulp.watch(['dev/css/**/*.{sass,scss}', 'dev/libs/bootstrap/scss/*.scss'], ['styles']);
});

// Default Task
gulp.task('default', ['html', 'javascript', 'styles', 'sync-proxy', 'watch']);

// Offline Task
gulp.task('offline', ['html', 'javascript', 'styles', 'sync-noproxy', 'watch']);

// var config = {
//   stylelint: {
//     'rules': {
//       'string-quotes': 'double',
//       'color-hex-case': 'lower',
//       'color-hex-length': 'long',
//       'color-no-invalid-hex': true,
//       'number-leading-zero': 'always',
//       'declaration-colon-space-after': 'always',
//       'max-empty-lines': 2
//     }
//   }
// };
