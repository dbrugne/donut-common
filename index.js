/**
 * [x] Must be installable via npm and bower: package.json and bower.json
 * [x] Must be loadable via npm and requirejs.
 * [x] Should manage dependencies.
 * [ ] May split in different files
 */

/** ===============================================================
 * NPM and requireJS loader with dependencies loading
 * ================================================================ */
(function() {
  var exports;
  if (typeof module !== 'undefined' && module.exports) {
    // NPM
    var _ = require('underscore');
    module.exports = donutCommonCode(_);
  } else if (typeof require !== 'undefined' && typeof define !== 'undefined') {
    // requireJS
    define(['underscore'], function(_) {
      return donutCommonCode(_);
    });
  } else {
    // unknown context
    return;
  }
})();

/** ===============================================================
 * Common code and logics
 * ================================================================ */
function donutCommonCode(_) {
  return {

    //

  };
};

