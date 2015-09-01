(function($, mw, undefined)
{
	var o;

	return register('mwApiSc', o);

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

}((function()
{

	if (typeof require === 'function')
	{
		return require('jquery');
	}
	return jQuery;

})(), mediaWiki));