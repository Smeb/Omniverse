module.exports = function(grunt) {
  grunt.initConfig({
    ts: {
      app: {
        files: [{
          src: ["src/\*\*/\*.ts", "!src/.baseDir.ts"],
          dest: "./dist"
        }],
        options: {
          module: "commonjs",
          target: "es2017",
          sourceMap: true,
          rootDir: "src"
        }
      },
    },
    exec: {
      test: "yarn test"
    },
    watch: {
      ts: {
        files: ["src/\*\*/\*.ts"],
        tasks: ["ts"]
      },
      tests: {
        files: ["test/\*\*/\*.ts"],
        tasks: ["exec"]
      }
    }
  });
  grunt.loadNpmTasks("grunt-exec");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-ts");

  grunt.registerTask("default", [
    "ts"
  ]);
};
