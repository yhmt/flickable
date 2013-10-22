matchdep  = require "matchdep"
copyright = "// <%= pkg.title %> <%= pkg.version %> Copyright (c) #{new Date().getFullYear()} <%= pkg.author %>\n" +
            "// See <%= pkg.url %>\n"

module.exports = (grunt) ->
  config =
    pkg: grunt.file.readJSON "package.json"

    concat:
      dist:
        options:
          banner: copyright
        files:
          "<%= pkg.name %>.all.js": [
            "src/intro.js"
            "src/variable.js"
            "src/helper.js"
            "src/flickable.js"
            "src/outro.js"
          ]

    uglify:
      dist:
        options:
          mangle: true
          banner: copyright
        files:
          "<%= pkg.name %>.min.js": ["<%= pkg.name %>.all.js"]

    esteWatch:
      options:
        dirs: ["src/**/"]
        livereload:
          enabled: false
      js: (filePath) ->
        files: "src/*.js"

        return ["concat", "jshint", "uglify"]

      # src:
      #   files: ["src/*.coffee"]
      #   tasks: "compile"
      # test:
      #   files: ["src/test/*.coffee"]
      #   tasks: "test"
      # prod:
      #   files: ["**/*.coffee"]
      #   tasks: "prod"

    jshint:
      src: ["flickable.all.js"]
      # options:
        # jshintrc: ".jshintrc"
      options: do ->
        ret = { globals: {} }
        opt = [
          "curly"    # ループブロックと条件ブロックを常に中括弧で囲うことを強制
          "eqeqeq"
          "eqnull"
          "immed"
          "latedef"
          "undef"
          # "unused"
          # "trailing" # 行末のホワイトスペースを禁止
          "browser"
          "devel"
        ]
        for o in opt then ret[o] = true
        opt["maxlen"]            = 120

        return ret

  grunt.initConfig config
  matchdep.filterDev("grunt-*").forEach grunt.loadNpmTasks

  grunt.registerTask "default", "esteWatch"

