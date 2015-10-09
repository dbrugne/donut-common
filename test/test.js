var _ = require('underscore');
var chai = require('chai');
var should = chai.should();
var linkify = require('linkifyjs');

var common = require('../server');

describe('parser()', function () {

  it('is function', function () {
    common.markup.parser.should.be.a('function');
  });
  var parser = common.markup.parser(linkify);
  it('parser is function', function () {
    parser.should.be.a('function');
  });
  it('replace user mention', function (done) {
    parser('@damien', null, function(err, string) {
      string.should.equal('@damien');
      parser('@damien.brugne', function(markups, fn) {
        markups.users[0].id = 'eedf43d2fddf4df2f3df4234';
        fn(null, markups);
      }, function(err, string) {
        string.should.equal('[@¦eedf43d2fddf4df2f3df4234¦damien.brugne]');
        done();
      });
    });
  });
  it('replace room mention', function (done) {
    parser('#donut', null, function(err, string) {
      string.should.equal('#donut');
      parser('#room-lib_re', function(markups, fn) {
        markups.rooms[0].id = 'eedf43d2fddf4df2f3df4234';
        fn(null, markups);
      }, function(err, string) {
        string.should.equal('[#¦eedf43d2fddf4df2f3df4234¦room-lib_re]');
        done();
      });
    });
  });
  it('replace room mention (unknown)', function (done) {
    parser('#NotExistingRoom__', function(markups, fn) {
      fn(null, markups);
    }, function(err, string) {
      string.should.equal('#NotExistingRoom__');
      parser('@donut and @support', function(markups, fn) {
        var foundMention = _.find(markups.users, function(e) {
          return (e.match === '@donut');
        });
        markups.users = [foundMention];
        fn(null, markups);
      }, function(err, string) {
        string.should.equal('@donut and @support');
        done();
      });
    });
  });
  it('replace room in group mention', function (done) {
    parser('#donut/admin', null, function(err, string) {
      string.should.equal('#donut/admin');
      parser('#donut/test', function(markups, fn) {
        markups.rooms[0].id = 'eedf43d2fddf4df2f3df4234';
        fn(null, markups);
      }, function(err, string) {
        string.should.equal('[#¦eedf43d2fddf4df2f3df4234¦donut/test]');
        done();
      });
    });
  });
  it('replace links', function (done) {
    parser('http://test.com', null, function(err, string) {
      string.should.equal('[url¦http://test.com¦http://test.com]');
      parser('https://test.com', null, function(err, string) {
        string.should.equal('[url¦https://test.com¦https://test.com]');
        parser('test.com', null, function(err, string) {
          string.should.equal('[url¦test.com¦http://test.com]');
          parser('http://test.com/api/test.html', null, function(err, string) {
            string.should.equal('[url¦http://test.com/api/test.html¦http://test.com/api/test.html]');
            parser('http://test.com/api/test.html?foo=bar', null, function(err, string) {
              string.should.equal('[url¦http://test.com/api/test.html?foo=bar¦http://test.com/api/test.html?foo=bar]');
              parser('http://test.com/api/test.html?foo=bar&test[value:test]', null, function(err, string) {
                string.should.equal('[url¦http://test.com/api/test.html?foo=bar&test[value:test]¦http://test.com/api/test.html?foo=bar&test[value:test]]');
                parser('http://test.com/api/test.html#anchor-test', null, function(err, string) {
                  string.should.equal('[url¦http://test.com/api/test.html#anchor-test¦http://test.com/api/test.html#anchor-test]');
                  parser('test.com and http://test.com and test.com', null, function(err, string) {
                    string.should.equal('[url¦test.com¦http://test.com] and [url¦http://test.com¦http://test.com] and [url¦test.com¦http://test.com]');
                    done();
                  });
                });
              });
            });
          });
        });
      });
    });
  });
  it('replace emails', function (done) {
    parser('foo.bar@gmail.com', null, function(err, string) {
      string.should.equal('[email¦foo.bar@gmail.com¦mailto:foo.bar@gmail.com]');
      done();
    });
  });
  it('preserve line breaks', function (done) {
    parser('my first line\nmy second\rmy third\r\nmy last', null, function(err, string) {
      string.should.equal('my first line\nmy second\rmy third\r\nmy last');
      done();
    });
  });
  it('replace in full string', function (done) {
    parser('Lorem #donut and @damien in http://test.com or test.com with test.com/page/test.html over foo.bar@gmail.com', function(markups, fn) {
      markups.rooms[0].id = 'eedf43d2fddf4df2f3df4600';
      markups.users[0].id = 'eedf43d2fddf4df2f3df4200';
      fn(null, markups);
    }, function(err, string) {
      string.should.equal('Lorem [#¦eedf43d2fddf4df2f3df4600¦donut] and [@¦eedf43d2fddf4df2f3df4200¦damien] in [url¦http://test.com¦http://test.com] or [url¦test.com¦http://test.com] with [url¦test.com/page/test.html¦http://test.com/page/test.html] over [email¦foo.bar@gmail.com¦mailto:foo.bar@gmail.com]');
      done();
    });
  });

});

describe('_find()', function() {

  it('is function', function () {
    common.markup._find.should.be.a('function');
  });
  it('find user mention', function () {
    var found = common.markup._find('[@¦eedf43d2fddf4df2f3df4200¦damien]');
    found.should.be.length(1);
    found = found[0];
    found.should.have.property('match').with.equal('[@¦eedf43d2fddf4df2f3df4200¦damien]');
    found.should.have.property('type').with.equal('user');
    found.should.have.property('id').with.equal('eedf43d2fddf4df2f3df4200');
    found.should.have.property('title').with.equal('@damien');
  });
  it('find room mention', function () {
    var found = common.markup._find('[#¦eedf43d2fddf4df2f3df4200¦donut]');
    found.should.be.length(1);
    found = found[0];
    found.should.have.property('match').with.equal('[#¦eedf43d2fddf4df2f3df4200¦donut]');
    found.should.have.property('type').with.equal('room');
    found.should.have.property('id').with.equal('eedf43d2fddf4df2f3df4200');
    found.should.have.property('title').with.equal('#donut');
  });
  it('find room in group mention', function () {
    var found = common.markup._find('[#¦eedf43d2fddf4df2f3df4200¦donut/test]');
    found.should.be.length(1);
    found = found[0];
    found.should.have.property('match').with.equal('[#¦eedf43d2fddf4df2f3df4200¦donut/test]');
    found.should.have.property('type').with.equal('room');
    found.should.have.property('id').with.equal('eedf43d2fddf4df2f3df4200');
    found.should.have.property('title').with.equal('#donut/test');
  });
  it('find link', function () {
    var found = common.markup._find('[url¦test.com¦http://test.com]');
    found.should.be.length(1);
    found = found[0];
    found.should.have.property('match').with.equal('[url¦test.com¦http://test.com]');
    found.should.have.property('type').with.equal('url');
    found.should.have.property('title').with.equal('test.com');
    found.should.have.property('href').with.equal('http://test.com');
  });
  it('find complex link', function () {
    common.markup._find('[url¦test.com/#api-test¦http://test.com/#api-test]')[0]
      .should.have.property('href')
      .with.equal('http://test.com/#api-test');
    common.markup._find('[url¦test.com/?foo=bar&test¦http://test.com/?foo=bar&test]')[0]
      .should.have.property('href')
      .with.equal('http://test.com/?foo=bar&test');
  });


});

describe('isUserMentionned()', function() {

  it('is function', function () {
    common.markup.isUserMentionned.should.be.a('function');
  });
  it('works', function () {
    common.markup.isUserMentionned('eedf43d2fddf4df2f3df4200', '[@¦eedf43d2fddf4df2f3df4200¦damien]').should.equal(true);
    common.markup.isUserMentionned('eedf43d2fddf4df2f3df4200', '[#¦eedf43d2fddf4df2f3df4200¦damien]').should.equal(false);
    common.markup.isUserMentionned('eedf43d2fddf4df2f3df4200', 'eedf43d2fddf4df2f3df4200').should.equal(false);
  });

});

describe('toHtml()', function() {

  it('is function', function () {
    common.markup.toHtml.should.be.a('function');
  });
  it('room mention', function () {
    common.markup.toHtml('[#¦eedf43d2fddf4df2f3df4200¦donut]')
      .should.equal('<a class="room" href="" style="">#donut</a>');
  });
  it('room in group mention', function () {
    common.markup.toHtml('[#¦eedf43d2fddf4df2f3df4200¦donut/test]')
      .should.equal('<a class="room" href="" style="">#donut/test</a>');
  });
  it('user mention', function () {
    common.markup.toHtml('[@¦eedf43d2fddf4df2f3df4200¦damien]')
      .should.equal('<a class="user" href="" style="">@damien</a>');
  });
  it('multiple', function () {
    common.markup.toHtml('[@¦eedf43d2fddf4df2f3df4200¦damien] is the same as [@¦eedf43d2fddf4df2f3df4200¦damien]')
      .should.equal('<a class="user" href="" style="">@damien</a> is the same as <a class="user" href="" style="">@damien</a>');
  });
  it('emails', function () {
    common.markup.toHtml('[email¦damien.brugne@gmail.com¦mailto:damien.brugne@gmail.com]')
      .should.equal('<a class="email" href="mailto:damien.brugne@gmail.com" style="">damien.brugne@gmail.com</a>');
  });
  it('link', function () {
    common.markup.toHtml('[url¦http://test.com/api/test.html?foo=bar&void¦http://test.com/api/test.html?foo=bar&void]')
      .should.equal('<a class="url" href="http://test.com/api/test.html?foo=bar&void" style="">http://test.com/api/test.html?foo=bar&void</a>');
    //common.markup.toHtml('[url¦http://test.com/api/test.html?foo=bar&test[value:test]¦http://test.com/api/test.html?foo=bar&test[value:test]]')
    //  .should.equal('<a class="url" href="http://test.com/api/test.html?foo=bar&test[value:test]" style="">http://test.com/api/test.html?foo=bar&test[value:test]</a>');
  });
  it('preserve line breaks', function () {
    common.markup.toHtml('my first line\nmy second\nmy third\nmy last')
      .should.equal('my first line<br>my second<br>my third<br>my last');
    common.markup.toHtml('my [#¦eedf43d2fddf4df2f3df4200¦donut] line\nmy [@¦eedf43d2fddf4df2f3df4200¦damien]')
      .should.equal('my <a class="room" href="" style="">#donut</a> line<br>my <a class="user" href="" style="">@damien</a>');
  });

});

describe('toText()', function() {

  it('is function', function () {
    common.markup.toText.should.be.a('function');
  });
  it('room mention', function () {
    common.markup.toText('[#¦eedf43d2fddf4df2f3df4200¦donut]')
      .should.equal('#donut');
  });
  it('room in group mention', function () {
    common.markup.toText('[#¦eedf43d2fddf4df2f3df4200¦donut/test]')
      .should.equal('#donut/test');
  });
  it('user mention', function () {
    common.markup.toText('[@¦eedf43d2fddf4df2f3df4200¦damien]')
      .should.equal('@damien');
  });
  it('multiple', function () {
    common.markup.toText('[@¦eedf43d2fddf4df2f3df4200¦damien] is the same as [@¦eedf43d2fddf4df2f3df4200¦damien]')
      .should.equal('@damien is the same as @damien');
  });
  it('emails', function () {
    common.markup.toText('[email¦damien.brugne@gmail.com¦mailto:damien.brugne@gmail.com]')
      .should.equal('damien.brugne@gmail.com');
  });
  it('link', function () {
    common.markup.toText('[url¦http://test.com/api/test.html?foo=bar&void¦http://test.com/api/test.html?foo=bar&void]')
      .should.equal('http://test.com/api/test.html?foo=bar&void');
  });

});

describe('special', function() {

  var parser = common.markup.parser(linkify);
  it('markupString', function(done) {
    parser('Cosplay is life @damien @David dans #donut et http://google.com ainsi que google.com', function(markups, fn) {
      _.each(markups.rooms, function(i) {
        i.id = 'eedf43d2fddf4df2f3df4200';
      });
      _.each(markups.users, function(i) {
          i.id = 'eedf43d2fddf4df2f3df4201';
      });
      fn(null, markups);
    }, function(err, string) {
      string.should.equal('Cosplay is life [@¦eedf43d2fddf4df2f3df4201¦damien] [@¦eedf43d2fddf4df2f3df4201¦David] dans [#¦eedf43d2fddf4df2f3df4200¦donut] et [url¦http://google.com¦http://google.com] ainsi que [url¦google.com¦http://google.com]');

      common.markup.toText(string).should.equal('Cosplay is life @damien @David dans #donut et http://google.com ainsi que google.com');
        common.markup.toHtml(string).should.equal('Cosplay is life <a class="user" href="" style="">@damien</a> <a class="user" href="" style="">@David</a> dans <a class="room" href="" style="">#donut</a> et <a class="url" href="http://google.com" style="">http://google.com</a> ainsi que <a class="url" href="http://google.com" style="">google.com</a>');
        done();
      });
  });

});

describe('cloudinary', function() {

  it('is function', function () {
    common.cloudinary.prepare.should.be.a('function');
  });
  it('no url', function () {
    should.equal(common.cloudinary.prepare(), null);
    should.equal(common.cloudinary.prepare(''), null);
    should.equal(common.cloudinary.prepare('', 120), null);
  });
  it('with size', function () {
    common.cloudinary.prepare('https://res.cloudinary.com/roomly/image/upload/b_rgb:123456,c_fill,d_user-avatar-default.png,f_jpg,g_face,h___height__,w___width__/v1409643461/rciev5ubaituvx5bclnz.jpg', 120)
      .should.equal('https://res.cloudinary.com/roomly/image/upload/b_rgb:123456,c_fill,d_user-avatar-default.png,f_jpg,g_face,h_120,w_120/v1409643461/rciev5ubaituvx5bclnz.jpg');
  });
  it('without size', function () {
    common.cloudinary.prepare('https://res.cloudinary.com/roomly/image/upload/b_rgb:123456,c_fill,d_user-avatar-default.png,f_jpg,g_face,h___height__,w___width__/v1409643461/rciev5ubaituvx5bclnz.jpg')
      .should.equal('https://res.cloudinary.com/roomly/image/upload/b_rgb:123456,c_fill,d_user-avatar-default.png,f_jpg,g_face,h_100,w_100/v1409643461/rciev5ubaituvx5bclnz.jpg');
  });
  it('no replacement', function () {
    common.cloudinary.prepare('https://res.cloudinary.com/roomly/image/upload/v1409643461/rciev5ubaituvx5bclnz.jpg').should.equal('https://res.cloudinary.com/roomly/image/upload/v1409643461/rciev5ubaituvx5bclnz.jpg');
  });

});

describe('validate', function() {
  describe('uri', function() {
    it('is function', function () {
      common.validate.uri.should.be.a('function');
      common.validate.uriExtract.should.be.a('function');
    });
    it('invalid', function () {
      common.validate.uri('').should.equal(false);
      common.validate.uri('test').should.equal(false);
      common.validate.uri('test#').should.equal(false);
      common.validate.uri('test/').should.equal(false);
      common.validate.uri('#test/').should.equal(false);
      common.validate.uri('test/test').should.equal(false);
    });
    it('valid', function () {
      common.validate.uri('#test').should.equal(true);
      common.validate.uri('#test/test').should.equal(true);
      common.validate.uri('#test_test/test-test').should.equal(true);
    });
    it('empty', function () {
      common.validate.uriExtract('').should.equal(false);
      common.validate.uriExtract('test').should.equal(false);
      common.validate.uriExtract('test/test').should.equal(false);
      common.validate.uriExtract('#').should.equal(false);
    });
    it('extract', function () {
      common.validate.uriExtract('#test').should.eql({room: 'test'});
      common.validate.uriExtract('#test/test').should.eql({ group: 'test', room: 'test' });
      common.validate.uriExtract('#test_test/test-test').should.eql({ group: 'test_test', room: 'test-test' });
    });
  });
  describe('mode', function() {
    it('is function', function () {
      common.validate.mode.should.be.a('function');
    });
    it('empty', function () {
      common.validate.mode('').should.equal(false);
    });
    it('wrong value', function () {
      common.validate.mode('false').should.equal(false);
    });
    _.each(common.validate.roomModes, function(mode){
      it('required value: '+mode, function () {
        common.validate.mode(mode).should.equal(true);
      });
    });
  });
});
