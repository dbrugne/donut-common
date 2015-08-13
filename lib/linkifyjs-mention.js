/**
	Quick Mention parser plugin for linkify
*/
'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

function mention(linkify) {
	var TT = linkify.scanner.TOKENS,
	    // Text tokens
	MT = linkify.parser.TOKENS,
	    // Multi tokens
	MultiToken = MT.Base,
	    S_START = linkify.parser.start,
	    S_HASH = undefined,
	    S_HASHTAG = undefined;

	var MENTION = (function (_MultiToken) {
		function MENTION(value) {
			_classCallCheck(this, MENTION);

			_MultiToken.call(this, value);
			this.type = 'mention';
			this.isLink = true;
		}

		_inherits(MENTION, _MultiToken);

		return MENTION;
	})(MultiToken);

	S_HASH = new linkify.parser.State();
	S_HASHTAG = new linkify.parser.State(MENTION);

	S_START.on(TT.AT, S_HASH);
	S_HASH.on(TT.DOMAIN, S_HASHTAG);
	S_HASH.on(TT.TLD, S_HASHTAG);
}

exports['default'] = mention;
module.exports = exports['default'];