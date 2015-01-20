var gulp = require('gulp'),
    gulp_clean = require('gulp-clean'),
    gulp_uglify = require('gulp-uglify'),
    gulp_streamify = require('gulp-streamify'),
    run_sequence = require('run-sequence'),
    browserify = require('browserify'),
    vinyl_source_stream = require('vinyl-source-stream');

var dist_fld = 'dist';

gulp.task('browserify', function(){
    return browserify('./index.js', {debug: false})
        .bundle()
        .pipe(vinyl_source_stream('sync-flux.js'))
        .pipe(gulp_streamify(gulp_uglify()))
        .pipe(gulp.dest('./' + dist_fld + '/'))
});

gulp.task('clean', function(){
    return gulp.src([dist_fld + '/*'], {read: false})
        .pipe(gulp_clean());
});

gulp.task('build', function(){
    run_sequence('clean', 'browserify');
});