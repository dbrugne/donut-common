module.exports = {
  /**
   * Escape RegExp reserved chars from string
   * @param string
   * @returns string
   */
  escape: function(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  },

  /**
   * Return a RegExp object that matchs subject equals the full string
   * @param string
   * @param flag
   * @returns {RegExp}
   */
  exact: function(string, flag) {
    flag = flag || 'i';
    string = ''+string;
    return new RegExp('^' + this.escape(string) + '$', flag);
  },

  /**
   * Return a RegExp object that matchs for string occurence in subject
   * @param string
   * @param flag
   * @returns {RegExp}
   */
  contains: function(string, flag) {
    flag = flag || 'i';
    string = ''+string;
    return new RegExp(this.escape(string), flag);
  },

  /**
   * Return a RegExp object that matchs for strings that begin with param
   * @param string
   * @param flag
   * @returns {RegExp}
   */
  starts: function(string, flag) {
    flag = flag || 'i';
    string = '' + string;
    return new RegExp('^' + this.escape(string), flag);
  }
};