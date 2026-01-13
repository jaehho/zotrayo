var ZoteroTray;

function log(msg) {
	Zotero.debug("ZoteroTray: " + msg);
}

function install() {
	log("Installed 0.1.0");
}

async function startup({ id, version, rootURI }) {
	log("Starting up");
	
	Services.scriptloader.loadSubScript(rootURI + 'zotrayo.js');
	ZoteroTray.init({ id, version, rootURI });
	await ZoteroTray.main();
}

function onMainWindowLoad({ window }) {
	ZoteroTray.addToWindow(window);
}

function onMainWindowUnload({ window }) {
	ZoteroTray.removeFromWindow(window);
}

function shutdown() {
	log("Shutting down");
	ZoteroTray.removeFromAllWindows();
	ZoteroTray = undefined;
}

function uninstall() {
	log("Uninstalled");
}
