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

    objectIdPattern: /^[0-9a-f]{24}$/i,

    roomNamePattern: /^#[-a-z0-9\._|[\]^]{3,24}$/i,

    userUsernamePattern : /^[-a-z0-9\._|^]{3,15}$/i,

    roomTopicPattern: /^.{0,512}$/i,

    // for searching in raw message string (e.g.: '#name' or '@username')
    mentionsRawPattern: /([#@]{1}[-a-z0-9\._|[\]^]{3,24})/ig,

    // for searching markuped message string (e.g.: [@:ObjectId():USERNAME] or [#:ObjectId():NAME])
    mentionsMarkupPattern: /\[([#@]{1}):([0-9a-f]{24}):([#@]{1}[-a-z0-9\._|[\]^]{3,23})]/ig,

    /**
     * Find user and room mention in string and return occurences as an array
     * @param string
     * @returns {Array}
     */
    findRawMentions: function(string) {
      var mention;
      var mentions = [];
      // @doc: https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/RegExp/exec
      while ((mention = this.mentionsRawPattern.exec(string)) !== null) {
        var m = {
          match : mention[0],
          index : mention.index
        };
        mentions.push(m);
      }

      return mentions;
    },

    /**
     * Find markups of user and room mentions in string and return occurences as an array
     * @param string
     * @returns {Array}
     */
    findMarkupedMentions: function(string) {
      var mention;
      var mentions = [];
      // @doc: https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/RegExp/exec
      while ((mention = this.mentionsMarkupPattern.exec(string)) !== null) {
        var m = {
          match : mention[0],
          index : mention.index,
          type  : (mention[1] === '@')
            ? 'user'
            : 'room',
          id    : mention[2],
          title : mention[3]
        };
        mentions.push(m);
      }
      return mentions;
    },

    /**
     * Test if userId is mentionned (markuped) in string
     * @param userId
     * @param string
     * @returns {boolean}
     */
    isUserMentionned: function(userId, string) {
      var mentions = this.findMarkupedMentions(string);
      if (!mentions.length)
        return false;

      return !!_.find(mentions, function(m) {
        if (m.id === userId)
          return true;
      });
    },

    /**
     * Replace mentions markups in given string
     * @param string
     * @returns {*}
     */
    markupMentions: function(string, mention, id, title) {
      if (mention.substr(0, 1) === '#')
        return string.replace(mention, '[#:'+ id+':'+ title+']');
      else if (mention.substr(0, 1) === '@')
        return string.replace(mention, '[@:'+ id+':@'+ title+']');
    },

    /**
     * Find and replace mentions in string with underscore template parameter
     * @param string
     * @param template Function
     * @param options
     * @returns String
     */
    htmlMentions: function(string, template, options) {
      options = options || {};
      var mentions = this.findMarkupedMentions(string);
      if (!mentions.length)
        return string;

      _.each(mentions, function(m) {
        var html = template({
          mention: m,
          options: options
        });
        string = string.replace(m.match, html);
      });

      return string;
    },

    /**
     * Find and replace mentions with text
     * @param string
     * @returns String
     */
    textMentions: function(string) {
      var mentions = this.findMarkupedMentions(string);
      if (!mentions.length)
        return string;

      _.each(mentions, function(m) {
        string = string.replace(m.match, m.title);
      });

      return string;
    },

    /**
     * Validate user username string
     * @param string
     * @returns {boolean}
     */
    validateUsername: function (string) {
      // Good length, only allowed chars.
      if (this.userUsernamePattern.test(string)) {
        // Must contains at least one letter or number
        var pattern2 = /[a-z0-9]+/i;
        if (pattern2.test(string)) {
          return true;
        }
      }
      return false;
    },

    /**
     * Validate room name string
     * @param string
     * @returns {boolean}
     */
    validateName: function (string) {
      if (this.roomNamePattern.test(string)) {
        return true;
      }
      return false;
    },

    /**
     * Validate room topic string
     * @param string
     * @returns {boolean}
     */
    validateTopic: function (string) {
      if (this.roomTopicPattern.test(string)) {
        return true;
      }
      return false;
    }

  };
};

