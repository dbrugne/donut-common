var _ = require('underscore');
var regexp = require('./regexp');

module.exports = {
  /******************************************************************
   *
   * Mentions and link detection and markuping
   *
   * [@¦55cdafb996cf9190695aebe9¦damien]
   * [#¦67rfdfb996cf9190695dfre5¦donut]
   * [url¦http://google.com¦http://google.com]
   * [email¦damien@donut.me¦mailto:damien@donut.me]
   *
   ******************************************************************/

  // search for #donut, #donutCoquin, #_donut_, #donut-coquin, #donut/donut
  rawRoomMentionPattern: /\s*(#([-a-z0-9_]{3,20})(\/)?([-a-z0-9_]{3,20})?)/ig,

  // search for @damien, @Damien, @damien.brugne, @damien_brugne, @damien-brugne
  rawUserMentionPattern: /\s*(@([-a-z0-9\._]{3,15}))/ig,

  // markup value separator
  mvs: '¦',

  // for searching markuped message string (e.g.: [@:ObjectId():USERNAME] or
  // [#:ObjectId():NAME])
  markupPattern: /\[(#|@|url|email)¦([^¦]+)¦([^¦\]]+)]/ig,

  /**
   * Return a new unique key generator used for string replacement
   * @returns {Function}
   */
  _keyGenerator: function () {
    var count = 0;
    return function () {
      return '___donut_markup_' + (count++) + '___';
    };
  },

  /**
   * Find link, email, room and user mentions in string and markup it.
   * @param string
   * @param enhanceCallback Function
   * @param finalCallback Function
   */
  parser: function (linkify) {
    return _.bind(function (string, enhanceCallback, finalCallback) {
      if (!_.isFunction(finalCallback)) {
        throw('callback is not a function');
      }

      var bag = {
        links: [],
        users: [],
        rooms: [],
        emails: [],
        all: []
      };
      var keyGenerator = this._keyGenerator();

      // search for links
      _.each(linkify.find(string), function (link) {
        var key = keyGenerator();
        if (link.type == 'url') {
          bag.links.push({
            key: key,
            match: link.value,
            href: link.href
          });
          string = string.replace(link.value, key);
          bag.all.push({ key: key, value: link.value });
        } else if (link.type == 'email') {
          bag.emails.push({
            key: key,
            match: link.value,
            href: link.href
          });
          string = string.replace(link.value, key);
          bag.all.push({ key: key, value: link.value });
        }
      });

      // search for room mentions
      var match;
      var key;
      while ((match = this.rawRoomMentionPattern.exec(string)) !== null) {
        key = keyGenerator();
        bag.rooms.push({
          key: key,
          match: match[ 1 ],
          name: (match[ 4 ]) ? match[ 4 ] : match [ 2 ]
        });
        string = string.replace(match[ 1 ], key);
        bag.all.push({ key: key, value: match[ 1 ] });
      }

      // search for user mentions
      while ((match = this.rawUserMentionPattern.exec(string)) !== null) {
        key = keyGenerator();
        bag.users.push({
          key: key,
          match: match[ 1 ],
          username: match[ 2 ]
        });
        string = string.replace(match[ 1 ], key);
        bag.all.push({ key: key, value: match[ 1 ] });
      }

      // 3 - replace unique key with final markup
      var mvs = this.mvs;
      var replaceKeysWithMarkups = function (err, bag) {
        if (err) {
          return finalCallback(err);
        }

        // post-processing
        _.each(bag.rooms, function (e) {
          if (e.id) {
            string = string.replace(e.key, '[#' + mvs + e.id + mvs + e.match.replace('#', '') + ']');
          } else {
            string = string.replace(e.key, e.match);
          }
        });
        _.each(bag.users, function (e) {
          if (e.id) {
            string = string.replace(e.key, '[@' + mvs + e.id + mvs + e.username + ']');
          } else {
            string = string.replace(e.key, e.match);
          }
        });
        _.each(bag.links, function (e) {
          string = string.replace(e.key, '[url' + mvs + e.match + mvs + e.href + ']');
        });
        _.each(bag.emails, function (e) {
          string = string.replace(e.key, '[email' + mvs + e.match + mvs + e.href + ']');
        });

        // cleanup matches that was -accidentally- removed from bag by
        // enhanceCallback
        _.each(bag.all, function (e) {
          string = string.replace(e.key, e.value);
        });
        bag = _.omit(bag, 'all');

        // final
        finalCallback(null, string, bag);
      };

      // 2 - optionnaly find entity in database and retrieve additionnal details
      if (_.isFunction(enhanceCallback)) {
        enhanceCallback(bag, replaceKeysWithMarkups);
      } else {
        replaceKeysWithMarkups(null, bag);
      }
    }, this);
  },

  /**
   * Find markups in string and return occurences as an array
   * @param string
   * @returns {Array}
   */
  _find: function (string) {
    var markup;
    var markups = [];
    // @doc:
    // https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/RegExp/exec
    while ((markup = this.markupPattern.exec(string)) !== null) {
      var element = {
        match: markup[ 0 ]
      };

      if (markup[ 1 ] === '@') {
        element.type = 'user';
        element.title = markup[ 1 ] + markup[ 3 ];
        element.id = markup[ 2 ];
      } else if (markup[ 1 ] === '#' && markup[ 3 ].slice(-1) === '/') {
        element.type = 'group';
        element.title = markup[ 1 ] + markup[ 3 ];
        element.id = markup[ 2 ];
      } else if (markup[ 1 ] === '#') {
        element.type = 'room';
        element.title = markup[ 1 ] + markup[ 3 ];
        element.id = markup[ 2 ];
      } else if (markup[ 1 ] === 'url') {
        element.type = markup[ 1 ];
        element.title = markup[ 2 ];
        element.href = markup[ 3 ];
      } else if (markup[ 1 ] === 'email') {
        element.type = markup[ 1 ];
        element.title = markup[ 2 ];
        element.href = markup[ 3 ];
      }
      markups.push(element);
    }
    return markups;
  },

  /**
   * Test if userId is mentionned (markuped) in string
   * @param userId
   * @param string
   * @returns {boolean}
   */
  isUserMentionned: function (userId, string) {
    var mentions = this._find(string);
    if (!mentions.length) {
      return false;
    }

    return !!_.find(mentions, function (m) {
      if (m.type === 'user' && m.id === userId) {
        return true;
      }
    });
  },

  defaultTemplate: _.template('<a class="<%= markup.type %>" href="<%= markup.href %>" style="<%= options.style %>"><%= markup.title %></a>'),

  /**
   * Prepare a markuped string (from database) to be displayed in HTML context
   * @param string
   * @param options
   * @returns String
   */
  toHtml: function (string, options) {
    options = options || {};
    var template = options.template || this.defaultTemplate;

    // find and replace markups
    var keyGenerator = this._keyGenerator();
    var markups = this._find(string);
    _.each(markups, _.bind(function (m) {
      m.key = keyGenerator();
      string = string.replace(new RegExp(regexp.escape(m.match), ''), m.key);
    }, this));

    // html escaping (only on string with unique key)
    string = _.escape(string);

    // line breaks
    string = string.replace(/\n/g, '<br>');

    if (!markups.length) {
      return string;
    }

    _.each(markups, _.bind(function (m) {
      var html = template({
        markup: m,
        options: options
      });
      string = string.replace(new RegExp(regexp.escape(m.key), ''), html);
    }, this));

    // remove line breaks from template
    string = string.replace(/\n/g, '');

    return string;
  },

  /**
   * Prepare a markuped string (from database) to be displayed in text context
   * @param string
   * @returns String
   */
  toText: function (string) {
    // find and replace markups
    var keyGenerator = this._keyGenerator();
    var markups = this._find(string);
    _.each(markups, _.bind(function (m) {
      m.key = keyGenerator();
      string = string.replace(new RegExp(regexp.escape(m.match), ''), m.key);
    }, this));

    // line-breaks (\n)
    string = string.replace(/<br>/g, '\n');

    if (!markups.length) {
      return string;
    }

    // mentions
    _.each(markups, _.bind(function (m) {
      string = string.replace(new RegExp(regexp.escape(m.key), ''), m.title);
    }, this));

    return string;
  }
};
