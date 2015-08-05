var assert = require("assert")

var common = require('../index');

// "Damien tu est super gentil comme @yangs dans #paintball ilé cool et osi [@:EEdf43d2fddf4df2f3df4234:Roger] or [#:23df43d2fddf4df2f3df4234:donut] ouais"

describe('Mentions management', function() {
  describe('findMarkupedMentions', function () {
    it('should validate', function () {
      var m = common.findMarkupedMentions("Lorem ipsum truc [@:EEdf43d2fddf4df2f3df4234:Roger] et loret");
      assert.equal(m.length, 1);

      var m = common.findMarkupedMentions("Lorem ipsum truc [@:EEdf43d2fddf4df2f3df4234:Roger] or [#:23df43d2fddf4df2f3df4234:donut] et loret");
      assert.equal(m.length, 2);

      var m = common.findMarkupedMentions("Lorem ipsu truc #donut et loret");
      assert.equal(m.length, 0);
    });
  });

  describe('findRawMentions', function () {
    it('should validate', function () {
      var m = common.findRawMentions("Lorem ipsu truc #donut et loret", 'Should find one');
      assert.equal(m.length, 1);

      var m = common.findRawMentions("Lorem ipsu truc #donut or @damien et loret", 'Should find 2');
      assert.equal(m.length, 2);

      var m = common.findRawMentions("Lorem ipsu truc &donut or @ damien or #do et loret", 'Should find nothing');
      assert.equal(m.length, 0);
    });
  });

  describe('isUserMentionned', function () {
    it('should validate', function () {
      var m = common.isUserMentionned('EEdf43d2fddf4df2f3df4234', "Lorem ipsu truc [@:EEdf43d2fddf4df2f3df4234:Roger] et loret");
      assert.equal(m, true);
      var m = common.isUserMentionned('EEdf43d2fddf4df2f3df4234', "Lorem ipsu truc [@:EEdf43d2fddf4df2f3df4111:Roger] et loret");
      assert.equal(m, false);
    });
  });
});
