module.exports = {
  /**
   * Returns a random alphanumerci string
   * @param length
   * @returns {string}
   */
  randomString: function (length) {
    length = length || 6;
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var string = '';
    for (var i = 0; i < length; i++) {
      var index = Math.floor(Math.random() * chars.length);
      string += chars[index];
    }
    return string;
  }
};
