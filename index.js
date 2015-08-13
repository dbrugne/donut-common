/******************************************************************
 *
 * NPM and requireJS loader with dependencies loading
 *
 ******************************************************************/
(function() {
  var exports;
  if (typeof module !== 'undefined' && module.exports) {
    // NPM
    var _ = require('underscore');
    var linkify = require('linkifyjs');
    require('linkifyjs/plugins/hashtag')(linkify);
    require('./lib/linkifyjs-mention')(linkify);
    module.exports = donutCommonCode(_, linkify);
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

/******************************************************************
 *
 * Common code and logics
 *
 ******************************************************************/
function donutCommonCode(_, linkify) {
  return {

    /**
     * Escape RegExp reserved chars from string
     * @param string
     * @returns string
     */
    regExpEscape: function(string) {
      return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    },

    /**
     * Return a RegExp object that match subject equals the full string
     * @param string
     * @param flag
     * @returns {RegExp}
     */
    regExpBuildExact: function(string, flag) {
      flag = flag || 'i';
      string = ''+string;
      return new RegExp('^' + this.regExpEscape(string) + '$', flag);
    },

    /**
     * Return a RegExp object that match for string occurence in subject
     * @param string
     * @param flag
     * @returns {RegExp}
     */
    regExpBuildContains: function(string, flag) {
      flag = flag || 'i';
      string = ''+string;
      return new RegExp(this.regExpEscape(string), flag);
    },

    /******************************************************************
     *
     * Mentions, link detection and markuping
     *
     ******************************************************************/

    // for searching in raw message string (e.g.: '#name' or '@username')
    mentionsRawPattern: /([#@]{1}[-a-z0-9\._|[\]^]{3,24})/ig,

    // for searching markuped message string (e.g.: [@:ObjectId():USERNAME] or [#:ObjectId():NAME])
    mentionsMarkupPattern: /\[([#@]{1}):([0-9a-f]{24}):([-a-z0-9\._|[\]^]{3,23})]/ig,

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
          title : mention[1]+mention[3]
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
     * Replace raw mentions with markups in given string
     * @param string
     * @returns {*}
     */
    markupMentions: function(string, mention, id, title) {
      if (mention.substr(0, 1) === '#')
        return string.replace(mention, '[#:'+ id+':'+ title.replace('#', '')+']');
      else if (mention.substr(0, 1) === '@')
        return string.replace(mention, '[@:'+ id+':'+ title+']');
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

      var already = [];
      _.each(mentions, _.bind(function(m) {
        if (already.indexOf(m.match) !== -1)
          return;
        var html = template({
          mention: m,
          options: options
        });
        string = string.replace(new RegExp(this.regExpEscape(m.match), 'g'), html);
        already.push(m.match);
      }, this));

      return string;
    },

    /**
     * Find and replace mentions markup with text
     * @param string
     * @returns String
     */
    textMentions: function(string) {
      var mentions = this.findMarkupedMentions(string);
      if (!mentions.length)
        return string;

      _.each(mentions, _.bind(function(m) {
        string = string.replace(new RegExp(this.regExpEscape(m.match), 'g'), m.title);
      }, this));

      return string;
    },


    /**
     * Find link, email, room and user mentions in string and markup it.
     * @param string
     * @param enhanceCallback Function
     * @param finalCallback Function
     */
    markupString: function(string, enhanceCallback, finalCallback) {
      if (!_.isFunction(finalCallback))
        throw('callback is not a function');

      // pre-processing: identify "elements" to markup
      var links = [];
      var users = [];
      var rooms = [];
      var emails = [];
      _.each(linkify.find(string), function(link) {
        if (link.type == 'hashtag') {
          rooms.push({
            match: link.value,
            name: link.value
          });
        } else if (link.type == 'mention') {
          users.push({
            match: link.value,
            username: link.value.replace('@', '')
          });
        } else if (link.type == 'url') {
          links.push({
            match: link.value,
            href: link.href
          });
        } else if (link.type == 'email') {
          emails.push({
            match: link.value,
            href: link.href
          });
        }
      });

      // processing: retrieve "entities" to markup
      var fn = function(err, string, links, rooms, users, emails) {
        if (err)
          return finalCallback(err);

        // post-processing
        _.each(rooms, function(e) {
          string = string.replace(e.match, '[#:' + e.id + ':' + e.match.replace('#', '') + ']');
        });
        _.each(users, function(e) {
          string = string.replace(e.match, '[@:' + e.id + ':' + e.username + ']');
        });
        _.each(links, function(e) {
          string = string.replace(e.match, '[url:' + e.match + ':' + e.href + ']');
        });
        _.each(emails, function(e) {
          string = string.replace(e.match, '[email:' + e.match + ':' + e.href + ']');
        });

        // final
        finalCallback(null, string, links, rooms, users, emails);
      };
      enhanceCallback(string, links, rooms, users, emails, fn);
    },

    /******************************************************************
     *
     * String validation
     *
     ******************************************************************/

    objectIdPattern: /^[0-9a-f]{24}$/i,

    roomNamePattern: /^#[-a-z0-9\._|[\]^]{3,24}$/i,

    userUsernamePattern : /^[-a-z0-9\._|^]{3,15}$/i,

    roomTopicPattern: /^.{0,512}$/i,

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

