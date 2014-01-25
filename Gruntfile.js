module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                // the banner is inserted at the top of the output
                banner: grunt.file.read('banner.txt')
            },
            dist: {
                files: {
                    'dist/propeller.min.js': ['src/propeller.js']
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', 'uglify');

};