module.exports = {
  objectIdPattern: /^[0-9a-f]{24}$/i,

  // allowed: alphanumeric - _
  groupNamePattern: /^[-a-z0-9_]{3,20}$/i,

  // allowed: alphanumeric - _ ^
  roomNamePattern: /^#[-a-z0-9_^]{3,24}$/i, // @todo reduce to 20 and remove ^

  // allowed: alphanumeric - _ ^
  roomUriPattern: /^#([-a-z0-9_]{3,20}\/)*([-a-z0-9_^]{3,24})$/i, // @todo reduce to 20 and remove ^

  // allowed: alphanumeric - . _ ^
  userUsernamePattern : /^[-a-z0-9\._^]{3,15}$/i,

  roomTopicPattern: /^.{0,512}$/i,

  roomModes: [
    'public',
    'private'
  ],

  /**
   * Validate ObjectId() string
   * @param string
   * @returns {boolean}
   */
  objectId: function (string) {
    return (this.objectIdPattern.test(string));
  },

  /**
   * Validate user username string
   * @param string
   * @returns {boolean}
   */
  username: function (string) {
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
   * Validate group name string
   * @param string
   * @returns {boolean}
   */
  group: function (string) {
    return (this.groupNamePattern.test(string));
  },

  /**
   * Validate room name string
   * @param string
   * @returns {boolean}
   */
  name: function (string) {
    return (this.roomNamePattern.test(string));
  },

  /**
   * Validate room uri string
   * @param string
   * @returns {boolean}
   */
  uri: function (string) {
    var identifier = this.uriExtract(string);
    return !!(identifier && identifier.room);
  },

  /**
   * Extract room and group from uri string
   * @param string
   * @returns {boolean}
   */
  uriExtract: function (string) {
    if (typeof string !== 'string') {
      return false;
    }
    var match = string.match(this.roomUriPattern);
    if (!match) {
      return false;
    }
    if (match[1]) {
      return {
        group: match[1].replace('/', ''),
        room: match[2]
      };
    } else {
      return {
        room: match[2]
      };
    }
  },

  /**
   * Validate room topic string
   * @param string
   * @returns {boolean}
   */
  topic: function (string) {
    return (this.roomTopicPattern.test(string));
  },

  /**
   * Validate modes
   * @param string
   * @returns {boolean}
   */
  mode: function (string) {
    return (this.roomModes.indexOf(string) !== -1);
  },
};