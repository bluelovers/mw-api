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

				$.each([
					'wgScriptPath',
					'wgScriptExtension',
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

			uploadFromUrl2: function (options, filename, text)
			{
				var _self = this, url;

				if (typeof options !== 'object')
				{
					url = options + '';

					options = new Object();
				}

				if (typeof filename === 'object')
				{
					$.extend(options, filename);

					delete filename;
				}

				url = url || options.url;

				delete options.url;

				options.text = text || options.text;

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
					var type = jqXHR.getResponseHeader('Content-Type');
					var blob = new Blob([result],
					{
						type: type
					});

					options.filename = filename || options.filename || _self.getUrlFilename(url, type);

					// do something with binary data
					var _data = $.extend({

						comment: 'upload by ' + uClass.fn._name_,
						text: 'source: ' + url + "\n\n" + 'upload by ' + uClass.fn._name_,

					}, options, {
						'token': _self.tokens('editToken'),
						'format': _self.option.format,
						'action': 'upload',
						//'filename': options.filename,
						//'url': 'http://www.google.com/intl/en_ALL/images/logo.gif',
						'file': result,
						//'file': blob,
						//'file':  new Blob([result])
						//'stash': 1,
					});
					var fd = new FormData();
					for (var i in _data)
					{
						/*
						console.log([fd,
							i,
							_data[i]
						]);
						*/
						fd.append(i, _data[i]);
					}

					console.log([_data,
						fd,
						result,
						textStatus,
						jqXHR,
						type
					]);

					$.ajax(
					{
						url: _self.wikiScript('api'),
						//method: 'POST',
						type: 'POST',
						data: fd,
						//data: _data,
						processData: false,
						contentType: false,
					}).always(function(data, textStatus, jqXHR)
					{
						console.log([data,
							textStatus,
							jqXHR
						]);

						if (data.upload && data.upload.result == 'Success')
						{
							dtd.resolve();
						}
						else
						{
							deferred.reject();
						}
					});
				});

				return dtd.promise();
			},

		});

		uClass.fn.initialize.prototype = uClass.fn;
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