var common = require('../index');
var _ = require('underscore');
var chai = require('chai');
chai.should();

describe('linkify', function() {

  it('is function', function () {
    common.getLinkify.should.be.a('function');
  });
  it('has find function', function () {
    common.getLinkify().find.should.be.a('function');
  });

});

describe('markupString()', function () {

  it('is function', function () {
    common.markupString.should.be.a('function');
  });
  it('replace user mention', function (done) {
    common.markupString('@damien', null, function(err, string) {
      string.should.equal('@damien');
      common.markupString('@damien.brugne', function(markups, fn) {
        markups.users[0].id = 'eedf43d2fddf4df2f3df4234';
        fn(null, markups);
      }, function(err, string) {
        string.should.equal('[@¦eedf43d2fddf4df2f3df4234¦damien.brugne]');
        done();
      });
    });
  });
  it('replace room mention', function (done) {
    common.markupString('#donut', null, function(err, string) {
      string.should.equal('#donut');
      common.markupString('#room-lib_re', function(markups, fn) {
        markups.rooms[0].id = 'eedf43d2fddf4df2f3df4234';
        fn(null, markups);
      }, function(err, string) {
        string.should.equal('[#¦eedf43d2fddf4df2f3df4234¦room-lib_re]');
        done();
      });
    });
  });
  it('replace room mention (unknown)', function (done) {
    common.markupString('#NotExistingRoom__', function(markups, fn) {
      fn(null, markups);
    }, function(err, string) {
      string.should.equal('#NotExistingRoom__');
      common.markupString('@donut and @support', function(markups, fn) {
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
  it('replace links', function (done) {
    common.markupString('http://test.com', null, function(err, string) {
      string.should.equal('[url¦http://test.com¦http://test.com]');
      common.markupString('https://test.com', null, function(err, string) {
        string.should.equal('[url¦https://test.com¦https://test.com]');
        common.markupString('test.com', null, function(err, string) {
          string.should.equal('[url¦test.com¦http://test.com]');
          common.markupString('http://test.com/api/test.html', null, function(err, string) {
            string.should.equal('[url¦http://test.com/api/test.html¦http://test.com/api/test.html]');
            common.markupString('http://test.com/api/test.html?foo=bar', null, function(err, string) {
              string.should.equal('[url¦http://test.com/api/test.html?foo=bar¦http://test.com/api/test.html?foo=bar]');
              common.markupString('http://test.com/api/test.html?foo=bar&test[value:test]', null, function(err, string) {
                string.should.equal('[url¦http://test.com/api/test.html?foo=bar&test[value:test]¦http://test.com/api/test.html?foo=bar&test[value:test]]');
                common.markupString('http://test.com/api/test.html#anchor-test', null, function(err, string) {
                  string.should.equal('[url¦http://test.com/api/test.html#anchor-test¦http://test.com/api/test.html#anchor-test]');
                  common.markupString('test.com and http://test.com and test.com', null, function(err, string) {
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
    common.markupString('foo.bar@gmail.com', null, function(err, string) {
      string.should.equal('[email¦foo.bar@gmail.com¦mailto:foo.bar@gmail.com]');
      done();
    });
  });
  it('preserve line breaks', function (done) {
    common.markupString('my first line\nmy second\rmy third\r\nmy last', null, function(err, string) {
      string.should.equal('my first line\nmy second\rmy third\r\nmy last');
      done();
    });
  });
  it('replace in full string', function (done) {
    common.markupString('Lorem #donut and @damien in http://test.com or test.com with test.com/page/test.html over foo.bar@gmail.com', function(markups, fn) {
      markups.rooms[0].id = 'eedf43d2fddf4df2f3df4600';
      markups.users[0].id = 'eedf43d2fddf4df2f3df4200';
      fn(null, markups);
    }, function(err, string) {
      string.should.equal('Lorem [#¦eedf43d2fddf4df2f3df4600¦donut] and [@¦eedf43d2fddf4df2f3df4200¦damien] in [url¦http://test.com¦http://test.com] or [url¦test.com¦http://test.com] with [url¦test.com/page/test.html¦http://test.com/page/test.html] over [email¦foo.bar@gmail.com¦mailto:foo.bar@gmail.com]');
      done();
    });
  });

});

describe('findMarkups()', function() {

  it('is function', function () {
    common.findMarkups.should.be.a('function');
  });
  it('find user mention', function () {
    var found = common.findMarkups('[@¦eedf43d2fddf4df2f3df4200¦damien]');
    found.should.be.length(1);
    found = found[0];
    found.should.have.property('match').with.equal('[@¦eedf43d2fddf4df2f3df4200¦damien]');
    found.should.have.property('type').with.equal('user');
    found.should.have.property('id').with.equal('eedf43d2fddf4df2f3df4200');
    found.should.have.property('title').with.equal('@damien');
  });
  it('find room mention', function () {
    var found = common.findMarkups('[#¦eedf43d2fddf4df2f3df4200¦donut]');
    found.should.be.length(1);
    found = found[0];
    found.should.have.property('match').with.equal('[#¦eedf43d2fddf4df2f3df4200¦donut]');
    found.should.have.property('type').with.equal('room');
    found.should.have.property('id').with.equal('eedf43d2fddf4df2f3df4200');
    found.should.have.property('title').with.equal('#donut');
  });
  it('find link', function () {
    var found = common.findMarkups('[url¦test.com¦http://test.com]');
    found.should.be.length(1);
    found = found[0];
    found.should.have.property('match').with.equal('[url¦test.com¦http://test.com]');
    found.should.have.property('type').with.equal('url');
    found.should.have.property('title').with.equal('test.com');
    found.should.have.property('href').with.equal('http://test.com');
  });
  it('find complex link', function () {
    common.findMarkups('[url¦test.com/#api-test¦http://test.com/#api-test]')[0]
      .should.have.property('href')
      .with.equal('http://test.com/#api-test');
    common.findMarkups('[url¦test.com/?foo=bar&test¦http://test.com/?foo=bar&test]')[0]
      .should.have.property('href')
      .with.equal('http://test.com/?foo=bar&test');
  });


});

describe('isUserMentionned()', function() {

  it('is function', function () {
    common.isUserMentionned.should.be.a('function');
  });
  it('works', function () {
    common.isUserMentionned('eedf43d2fddf4df2f3df4200', '[@¦eedf43d2fddf4df2f3df4200¦damien]').should.equal(true);
    common.isUserMentionned('eedf43d2fddf4df2f3df4200', '[#¦eedf43d2fddf4df2f3df4200¦damien]').should.equal(false);
    common.isUserMentionned('eedf43d2fddf4df2f3df4200', 'eedf43d2fddf4df2f3df4200').should.equal(false);
  });

});

describe('markupToHtml()', function() {

  it('is function', function () {
    common.markupToHtml.should.be.a('function');
  });
  it('room mention', function () {
    common.markupToHtml('[#¦eedf43d2fddf4df2f3df4200¦donut]')
      .should.equal('<a class="room" href="" style="">#donut</a>');
  });
  it('user mention', function () {
    common.markupToHtml('[@¦eedf43d2fddf4df2f3df4200¦damien]')
      .should.equal('<a class="user" href="" style="">@damien</a>');
  });
  it('multiple', function () {
    common.markupToHtml('[@¦eedf43d2fddf4df2f3df4200¦damien] is the same as [@¦eedf43d2fddf4df2f3df4200¦damien]')
      .should.equal('<a class="user" href="" style="">@damien</a> is the same as <a class="user" href="" style="">@damien</a>');
  });
  it('emails', function () {
    common.markupToHtml('[email¦damien.brugne@gmail.com¦mailto:damien.brugne@gmail.com]')
      .should.equal('<a class="email" href="mailto:damien.brugne@gmail.com" style="">damien.brugne@gmail.com</a>');
  });
  it('link', function () {
    common.markupToHtml('[url¦http://test.com/api/test.html?foo=bar&void¦http://test.com/api/test.html?foo=bar&void]')
      .should.equal('<a class="url" href="http://test.com/api/test.html?foo=bar&void" style="">http://test.com/api/test.html?foo=bar&void</a>');
    //common.markupToHtml('[url¦http://test.com/api/test.html?foo=bar&test[value:test]¦http://test.com/api/test.html?foo=bar&test[value:test]]')
    //  .should.equal('<a class="url" href="http://test.com/api/test.html?foo=bar&test[value:test]" style="">http://test.com/api/test.html?foo=bar&test[value:test]</a>');
  });
  it('preserve line breaks', function () {
    common.markupToHtml('my first line\nmy second\nmy third\nmy last')
      .should.equal('my first line<br>my second<br>my third<br>my last');
    common.markupToHtml('my [#¦eedf43d2fddf4df2f3df4200¦donut] line\nmy [@¦eedf43d2fddf4df2f3df4200¦damien]')
      .should.equal('my <a class="room" href="" style="">#donut</a> line<br>my <a class="user" href="" style="">@damien</a>');
  });

});

describe('markupToText()', function() {

  it('is function', function () {
    common.markupToText.should.be.a('function');
  });
  it('room mention', function () {
    common.markupToText('[#¦eedf43d2fddf4df2f3df4200¦donut]')
      .should.equal('#donut');
  });
  it('user mention', function () {
    common.markupToText('[@¦eedf43d2fddf4df2f3df4200¦damien]')
      .should.equal('@damien');
  });
  it('multiple', function () {
    common.markupToText('[@¦eedf43d2fddf4df2f3df4200¦damien] is the same as [@¦eedf43d2fddf4df2f3df4200¦damien]')
      .should.equal('@damien is the same as @damien');
  });
  it('emails', function () {
    common.markupToText('[email¦damien.brugne@gmail.com¦mailto:damien.brugne@gmail.com]')
      .should.equal('damien.brugne@gmail.com');
  });
  it('link', function () {
    common.markupToText('[url¦http://test.com/api/test.html?foo=bar&void¦http://test.com/api/test.html?foo=bar&void]')
      .should.equal('http://test.com/api/test.html?foo=bar&void');
  });

});

describe('special', function() {

  it('markupString', function(done) {
    common.markupString('Cosplay is life @damien @David dans #donut et http://google.com ainsi que google.com', function(markups, fn) {
      _.each(markups.rooms, function(i) {
        i.id = 'eedf43d2fddf4df2f3df4200';
      });
      _.each(markups.users, function(i) {
          i.id = 'eedf43d2fddf4df2f3df4201';
      });
      fn(null, markups);
    }, function(err, string) {
      string.should.equal('Cosplay is life [@¦eedf43d2fddf4df2f3df4201¦damien] [@¦eedf43d2fddf4df2f3df4201¦David] dans [#¦eedf43d2fddf4df2f3df4200¦donut] et [url¦http://google.com¦http://google.com] ainsi que [url¦google.com¦http://google.com]');

      common.markupToText(string).should.equal('Cosplay is life @damien @David dans #donut et http://google.com ainsi que google.com');
        common.markupToHtml(string).should.equal('Cosplay is life <a class="user" href="" style="">@damien</a> <a class="user" href="" style="">@David</a> dans <a class="room" href="" style="">#donut</a> et <a class="url" href="http://google.com" style="">http://google.com</a> ainsi que <a class="url" href="http://google.com" style="">google.com</a>');
        done();
      });
  });

});