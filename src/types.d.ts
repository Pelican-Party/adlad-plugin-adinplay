interface Window {
	aiptag: any;
	aipDisplayTag: any;
}

interface AipPlayerOptions {
	AD_WIDTH: number;
	AD_HEIGHT: number;
	AD_FULLSCREEN: boolean;
	AD_CENTERPLAYER: boolean;
	LOADING_TEXT: string;
	PREROLL_ELEM: () => HTMLElement;
	AIP_COMPLETE: () => void;
	AIP_BLOCKED: () => void;
	AIP_NOADS: () => void;
}

// deno-lint-ignore no-unused-vars
class aipPlayer {
	constructor(options: AipPlayerOptions);
	startPreRoll() {}
}
