var MakeItRed;

function log(msg) {
	Zotero.debug("Zotrayo log: " + msg);
}

function install() {
	log("Installed Zotrayo");
}

async function startup({ id, version, rootURI }) {
	log("Starting Zotrayo");
	
	Zotero.PreferencePanes.register({
		pluginID: 'zotrayo@jaehho.com',
		src: rootURI + 'preferences.xhtml',
		scripts: [rootURI + 'preferences.js']
	});
	
	Services.scriptloader.loadSubScript(rootURI + 'make-it-red.js');
	MakeItRed.init({ id, version, rootURI });
	MakeItRed.addToAllWindows();
	await MakeItRed.main();
}

function onMainWindowLoad({ window }) {
	MakeItRed.addToWindow(window);
}

function onMainWindowUnload({ window }) {
	MakeItRed.removeFromWindow(window);
}

function shutdown() {
	log("Shutting down Zotrayo");
	MakeItRed.removeFromAllWindows();
	MakeItRed = undefined;
}

function uninstall() {
	log("Uninstalled Zotrayo");
}
