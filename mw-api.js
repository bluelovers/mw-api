(function($, mw, undefined)
{
	var _env_ = new Object();

	var uObject;

	var extend = $.extend;

	_ajax_hack();
	uClass();

	return register(uClass.fn._name_, uObject = uClass);

	function uClass(option)
	{
		if (uClass.prototype.isReady)
		{
			return new uClass.fn.initialize(option);
		}

		uClass.fn = uClass.prototype.fn = extend(uClass.prototype, {

			_name_: 'mwApiSc',

			isReady: true,

			_default: {
				mw: mw,

				/*
				wgScriptPath: null,
				wgScriptExtension: null,
				*/

				format: 'json',
			},

			initialize: function(option)
			{
				var _self = this;

				this.option = $.extend(
				{}, this._default,
				{}, option);

				this._cache_ = new Object();

				$.each([
					'wgScriptPath',
					'wgScriptExtension',

					'wgUserLanguage',
				], function(i, v)
				{
					if (_self.option[v] === null || _self.option[v] === undefined)
					{
						_self.option[v] = _self.mw().config.get(v);
					}
				});

				return this;
			},

			mw: function()
			{
				return this.option.mw;
			},

			tokens: function (name)
			{
				return this.mw().user.tokens.get(name ? name : 'editToken');
			},

			wikiScript: function (str)
			{
				return this.mw().util.wikiScript('api');
				//return this.mw().config.get('wgScriptPath') + '/' + (str || 'index') + this.mw().config.get('wgScriptExtension');
			},

			getUrlFilename: function (url, mime)
			{
				var v = parse_url(url);

				var file = v.file + '';
				var a = file.split('.');

				var ext;

				if (v[v.length - 1])
				{
					ext = this.getExtByMime(mime);
				}

				if (!ext)
				{
					ext = (url.match(/((?:\.[a-z0-9]{1,4})+)$/i) || [])[0];
				}

				if (file)
				{
					file = file + ext;
				}

				return file;
			},

			getExtByMime: function (mime)
			{
				switch (mime)
				{
					case 'image/jpeg':
						return '.jpg';
						break;
					case 'image/png':
						return '.png';
						break;
					case 'image/x-icon':
						return '.ico';
						break;
					default:
						// default statements
						break;
				}
			},

			uploadFromUrl2: function (data, filename, text)
			{
				var _self = this, url;

				if (typeof data !== 'object')
				{
					url = data + '';

					data = new Object();
				}

				if (typeof filename === 'object')
				{
					$.extend(data, filename);

					delete filename;
					filename = undefined;
				}

				url = url || data.url;

				delete data.url;

				data.text = text || data.text;

				var dtd = jQuery.Deferred();

				$.ajax(
				{
					//url: $('.fullMedia a').attr('href'),
					url: url,
					type: 'GET',
					dataType: 'binary',
					processData: false,
					//responseType:'arraybuffer',
					//responseType:'blob',
				}).done(function(result, textStatus, jqXHR)
				{
					/*
					var type = jqXHR.getResponseHeader('Content-Type');
					var blob = new Blob([result],
					{
						type: type
					});
					*/

					var type = result.type;
					var blob = result;

					data.filename = filename || data.filename || _self.getUrlFilename(url, type);

					// do something with binary data
					var _data = $.extend({

						comment: 'upload by ' + uClass.fn._name_,
						text: 'source: ' + url + "\n\n" + 'upload by ' + uClass.fn._name_,

					}, data, {
						/*
						'token': _self.tokens('editToken'),
						'format': _self.option.format,
						'action': 'upload',
						*/
						//'filename': options.filename,
						//'url': 'http://www.google.com/intl/en_ALL/images/logo.gif',
						//'file': result,
						'file': blob,
						//'file':  new Blob([result])
						//'stash': 1,

						//ignorewarnings: true,
					});

					var options = {
						processData: false,
						contentType: false,

						ignorewarnings: _data.ignorewarnings,
					};

					_data.ignorewarnings = undefined;
					delete _data.ignorewarnings;

					var fd = new FormData();
					for (var i in _data)
					{
						fd.append(i, _data[i]);
					}

					console.log([_data,
						fd,
						result,
						blob,
						textStatus,
						jqXHR,
						type
					]);

					_self.upload(fd, options, dtd);
				});

				return dtd.promise();
			},

			api: function (options)
			{
				var _self = this;

				options.data = $.extend({
					'format': _self.option.format,
				}, options.data);

				return $.ajax($.extend(
				{
					url: _self.wikiScript('api'),
					type: 'GET',
				}, options, {}));
			},

			/**
			 * https://phabricator.wikimedia.org/diffusion/MW/browse/master/resources/src/mediawiki.api/mediawiki.api.upload.js
			 * https://www.mediawiki.org/wiki/API:Upload
			 **/
			upload: function (data, options, dtd)
			{
				var _self = this;

				if (_self.isDeferred(options))
				{
					dtd = options;
					options = new Object();
				}

				if (dtd === undefined)
				{
					dtd = jQuery.Deferred();
				}

				var _default = {
					'token': _self.tokens('editToken'),
					'format': _self.option.format,
					'action': 'upload',
				};

				var filename;

				if (data instanceof FormData)
				{
					$.each(_default, function (i, v) {
						data.set(i, v);
					});

					filename = data.get('filename');
				}
				else
				{
					data = $.extend(data, _default);

					filename = data.filename;
				}

				delete options.data;

				options = $.extend(
				{
					url: _self.wikiScript('api'),
					type: 'POST',
					data: data,
					processData: false,
					contentType: false,
				}, options, {});

				console.log([options, data]);

				$.ajax(options).always(function(result, textStatus, jqXHR)
				{
					console.log([result,
						textStatus,
						jqXHR
					]);

					/*
					result.upload.warnings = {
						'was-deleted': filename,
						'duplicate-archive': filename,
						exists: filename,
					};
					*/

					if (result.upload && result.upload.result === 'Success')
					{
						dtd.resolve(result, textStatus, jqXHR);
					}
					else if (options.ignorewarnings && result.upload && result.upload.result === 'Warning' && result.upload.warnings)
					{
						var ignorewarnings = !!(options.ignorewarnings === 'all' || options.ignorewarnings === true);

						if (!ignorewarnings)
						{
							$.each(result.upload.warnings, function (i, v)
							{
								var flag = typeof options.ignorewarnings[i] === 'function' ? options.ignorewarnings[i].call(_self, i, v, options, result) : options.ignorewarnings[i];

								console.log([i, v, options.ignorewarnings[i], flag]);

								if (flag !== true)
								{
									return ignorewarnings = false;
								}
							});
						}

						console.log([ignorewarnings, options.ignorewarnings]);

						if (ignorewarnings)
						{
							delete options.ignorewarnings;

							_self.upload({

								filekey: result.upload.filekey,
								sessionkey: result.upload.sessionkey || result.upload.filekey,

								ignorewarnings: ignorewarnings,

								filename: filename,

							}, options, dtd);
						}
						else
						{
							dtd.resolve(result, textStatus, jqXHR);
						}
					}
					else
					{
						dtd.reject(result, textStatus, jqXHR);
					}
				});

				return dtd.promise();
			},

			isDeferred: function (dtd)
			{
				var type = $.type(dtd);

				return !!((Promise && dtd instanceof Promise) || ((type === 'object' || type === 'function') && typeof dtd.reject === 'function' && typeof dtd.resolve === 'function'))
			},

			debug: function (flag)
			{
				if (flag === undefined)
				{
					return this.mw().config.get('debug');
				}

				flag = !!flag;

				var options = {
					expires : 1,
					path : '/',
				};

				this.mw().config.set('debug', flag);
				$.cookie("resourceLoaderDebug", flag, options);

				return this;
			},

			loadMessages: function (messages, lang, wait)
			{
				var _self = this;

				return _self.api({

					data: {
						action: 'query',
						meta: 'allmessages',
						amlang: (lang = lang || _self.option['wgUserLanguage']),
						ammessages: $.isArray(messages) ? messages.join('|') : messages,
					},

					async: !wait,

					timeout: 1000,

					cache: false,

				}).done(function(data)
				{
					_self._init_messages(lang);

					$.each(data.query.allmessages, function(index, message)
					{
						if (message.missing !== '')
						{
							_self._cache_.messages[lang].set(message.name, message['*']);
						}
						else
						{
							_self._cache_.messages_missing.set(message.name, false);
						}
					});
				});
			},

			/**
			 * https://phabricator.wikimedia.org/diffusion/MW/browse/master/resources/src/mediawiki/mediawiki.js
			 **/
			_init_messages: function (lang)
			{
				var _self = this;

				var lang = lang || _self.option['wgUserLanguage'];

				_self._cache_.messages = _self._cache_.messages || {};

				var mw = _self.mw();

				_self._cache_.messages_missing = _self._cache_.messages_missing || new mw.Map();

				if (!_self._cache_.messages[lang])
				{
					if (lang == _self.option['wgUserLanguage'])
					{
						_self._cache_.messages[lang] = _self.mw().messages = _self.mw().messages || new mw.Map();
					}
					else
					{
						_self._cache_.messages[lang] = new mw.Map();
					}
				}
			},

			msg: function ()
			{
				var _self = this;

				var args = Array.prototype.slice.call(arguments, 0) || [];

				args.unshift(_self.option['wgUserLanguage']);

				return this.msgWithLang.apply(this, args);
			},

			msgWithLang: function (lang)
			{
				var _self = this;

				var args = Array.prototype.slice.call(arguments, 0) || [];
				var lang = args.shift() || _self.option['wgUserLanguage'];

				_self._init_messages(lang);

				if (!_self._cache_.messages[lang].exists(args[0]) && !_self._cache_.messages_missing.exists(args[0]))
				{
					_self.loadMessages(args[0], lang, true);
				}

				return _self.mw().message.apply(_self._cache_.messages[lang], args).toString();
			},

		});

		uClass.fn.initialize.prototype = uClass.fn;

		uClass.name = uClass.fn.initialize.name = uClass.fn._name_;
	};

	function register(name, obj)
	{
		(function()
		{
			if (typeof module === 'object' && typeof module.exports === 'object')
			{
				module.exports = obj;
			}
			else if (typeof define === 'function' && define.amd)
			{
				//console.log(['define', name, obj]);

				define(name, [], function()
				{
					return obj;
				});
			}
		})();

		(function(_old)
		{
			if (obj.noConflict === undefined)
			{
				obj.noConflict = function()
				{
					window[name] = _old;
					return this;
				};
			}

			window[name] = obj;
		})(window[name]);

		return obj;
	};

	function mwApiClass (options)
	{
		if (mwApiClass.prototype.isReady)
		{
			return new mwApiClass.fn.initialize(option);
		}

		mwApiClass.fn = mwApiClass.prototype.fn = extend(mwApiClass.prototype, {

			//_name_: '',

			isReady: true,

			_default: {
				format: 'json',
			},

			initialize: function(option)
			{
				var _self = this;

				_self.option = $.extend(
				{}, this._default,
				{}, option);

				return _self;
			},
		});
	}

	function _ajax_hack()
	{
		// use this transport for "binary" data type
		$.ajaxTransport("+binary", function(options, originalOptions, jqXHR)
		{
			// check for conditions and support for blob / arraybuffer response type
			if (window.FormData && ((options.dataType && (options.dataType == 'binary')) || (options.data && ((window.ArrayBuffer && options.data instanceof ArrayBuffer) || (window.Blob && options.data instanceof Blob)))))
			{
				return {
					// create new XMLHttpRequest
					send: function(_, callback)
					{
						// setup all variables
						var xhr = new XMLHttpRequest(),
							url = options.url,
							type = options.type,
							// blob or arraybuffer. Default is blob
							dataType = options.responseType || "blob",
							data = options.data || null;

						xhr.addEventListener('load', function()
						{
							var data = {};
							data[options.dataType] = xhr.response;
							// make callback and send data
							callback(xhr.status, xhr.statusText, data, xhr.getAllResponseHeaders());
						});

						xhr.open(type, url, true);
						xhr.responseType = dataType;
						xhr.send(data);
					},
					abort: function()
					{
						jqXHR.abort();
					}
				};
			}
		});
	};

function parse_url(str, component)
{
	// http://kevin.vanzonneveld.net
	// +      original by: Steven Levithan (http://blog.stevenlevithan.com)
	// + reimplemented by: Brett Zamir (http://brett-zamir.me)
	// + input by: Lorenzo Pisani
	// + input by: Tony
	// + improved by: Brett Zamir (http://brett-zamir.me)
	// %          note: Based on http://stevenlevithan.com/demo/parseuri/js/assets/parseuri.js
	// %          note: blog post at http://blog.stevenlevithan.com/archives/parseuri
	// %          note: demo at http://stevenlevithan.com/demo/parseuri/js/assets/parseuri.js
	// %          note: Does not replace invalid characters with '_' as in PHP, nor does it return false with
	// %          note: a seriously malformed URL.
	// %          note: Besides function name, is essentially the same as parseUri as well as our allowing
	// %          note: an extra slash after the scheme/protocol (to allow file:/// as in PHP)
	// *     example 1: parse_url('http://username:password@hostname/path?arg=value#anchor');
	// *     returns 1: {scheme: 'http', host: 'hostname', user: 'username', pass: 'password', path: '/path', query: 'arg=value', fragment: 'anchor'}
	var key = ['source', 'scheme', 'authority', 'userInfo', 'user', 'pass', 'host', 'port',
		                'relative', 'path', 'directory', 'file', 'query', 'fragment'],
		ini = (this.php_js && this.php_js.ini) || {},
		mode = (ini['phpjs.parse_url.mode'] && ini['phpjs.parse_url.mode'].local_value) || 'php',
		parser = {
			php: /^(?:([^:\/?#]+):)?(?:\/\/()(?:(?:()(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?()(?:(()(?:(?:[^?#\/]*\/)*)()(?:[^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
			strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
			loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/\/?)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/ // Added one optional slash to post-scheme to catch file:/// (should restrict this)
		};

	var m = parser[mode].exec(str),
		uri = {},
		i = 14;
	while (i--)
	{
		if (m[i])
		{
			uri[key[i]] = m[i];
		}
	}

	if (component)
	{
		return uri[component.replace('PHP_URL_', '').toLowerCase()];
	}
	if (mode !== 'php')
	{
		var name = (ini['phpjs.parse_url.queryKey'] && ini['phpjs.parse_url.queryKey'].local_value) || 'queryKey';
		parser = /(?:^|&)([^&=]*)=?([^&]*)/g;
		uri[name] = {};
		uri[key[12]].replace(parser, function($0, $1, $2)
		{
			if ($1)
			{
				uri[name][$1] = $2;
			}
		});
	}

	for (i in key)
	{
		if (!uri[key[i]])
		{
			uri[key[i]] = '';
		}
	}

	delete uri.source;
	return uri;
}

}((function()
{

	if (!jQuery && typeof require === 'function')
	{
		return require('jquery');
	}
	return jQuery;

})(), mediaWiki));