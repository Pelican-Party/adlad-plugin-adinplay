/**
 * @param {Object} options
 * @param {string} options.publisher Publisher string used for fetching the script url. If you were told to include `https://api.adinplay.com/libs/aiptag/pub/PUBLISHER/SITE/tag.min.js` on your page, then `PUBLISHER` would be your publisher id.
 * @param {string} options.site Site string used for fetching the script url. If you were told to include `https://api.adinplay.com/libs/aiptag/pub/PUBLISHER/SITE/tag.min.js` on your page, then `SITE` would be your site id.
 */
export function adinPlayPlugin({
	publisher,
	site,
}) {
	/** @type {aipPlayer} */
	let player;

	/** @type {Set<(result: import("$adlad").ShowFullScreenAdResult) => void>} */
	const fullScreenPromiseCbs = new Set();

	/**
	 * @param {import("$adlad").ShowFullScreenAdResult} result
	 */
	function resolveFullScreenPromises(result) {
		fullScreenPromiseCbs.forEach((cb) => {
			cb(result);
		});
		fullScreenPromiseCbs.clear();
	}

	const plugin = {
		name: /** @type {const} */ ("adinplay"),
		async initialize() {
			/** @type {any} */
			const aiptag = window["aiptag"] = window.aiptag || {};
			aiptag.cmd = aiptag.cmd || [];
			aiptag.cmd.display = aiptag.cmd.display || [];
			aiptag.cmd.player = aiptag.cmd.player || [];
			aiptag.cmp = {
				show: true,
				position: "centered",
				button: false,
				buttonPosition: "top-left",
			};

			const prerollElem = document.createElement("div");
			document.body.appendChild(prerollElem);

			aiptag.cmd.player.push(() => {
				player = new aipPlayer({
					AD_WIDTH: 960,
					AD_HEIGHT: 540,
					AD_FULLSCREEN: true,
					AD_CENTERPLAYER: false,
					LOADING_TEXT: "loading advertisement",
					PREROLL_ELEM: () => prerollElem,
					AIP_COMPLETE: () => {
						resolveFullScreenPromises({
							didShowAd: true,
							errorReason: null,
						});
					},
					AIP_BLOCKED: () => {
						resolveFullScreenPromises({
							didShowAd: false,
							errorReason: "adblocker",
						});
					},
					AIP_NOADS: () => {
						resolveFullScreenPromises({
							didShowAd: false,
							errorReason: "no-ad-available",
						});
					},
				});
			});

			const script = document.createElement("script");
			script.src = `https://api.adinplay.com/libs/aiptag/pub/${publisher}/${site}/tag.min.js`;
			script.async = true;
			document.head.appendChild(script);

			/** @type {Promise<void>} */
			const scriptPromise = new Promise((resolve, reject) => {
				script.addEventListener("load", () => {
					resolve();
				});

				script.addEventListener("error", () => {
					reject(new Error("Failed to load " + script.src));
				});
			});
			await scriptPromise;
		},
		async showFullScreenAd() {
			window.aiptag.cmd.player.push(() => player.startPreRoll());
			/** @type {Promise<import("$adlad").ShowFullScreenAdResult>} */
			const promise = new Promise((resolve) => {
				fullScreenPromiseCbs.add(resolve);
			});
			return await promise;
		},
		/**
		 * @param {import("$adlad").ShowBannerAdPluginOptions} options
		 * @param {Object} pluginOptions
		 * @param {Object.<string, string> | string} pluginOptions.ids
		 */
		showBannerAd(options, pluginOptions) {
			/** @type {string} */
			let id;
			if (typeof pluginOptions.ids == "string") {
				id = pluginOptions.ids;
			} else {
				const sizeString = options.width + "x" + options.height;
				id = pluginOptions.ids[sizeString];
				if (!id) return;
			}

			const existingEl = options.el.children[0];
			const needsNewEl = !existingEl || existingEl.id != id;
			if (needsNewEl) {
				while (options.el.childElementCount) {
					options.el.children[0].remove();
				}
				const el = document.createElement("div");
				el.id = id;
				options.el.appendChild(el);
			}
			window.aiptag.cmd.display.push(() => window.aipDisplayTag.display(id));
		},
	};
	return plugin;
}
