ZoteroTray = {
	id: null,
	version: null,
	rootURI: null,
	initialized: false,
	
	init({ id, version, rootURI }) {
		if (this.initialized) return;
		this.id = id;
		this.version = version;
		this.rootURI = rootURI;
		this.initialized = true;
		Zotero.debug("ZoteroTray: Initialized v" + version);
	},
	
	log(msg) {
		Zotero.debug("ZoteroTray: " + msg);
	},
	
	addToWindow(window) {
		this.log("Adding to window: " + window.location.href);
	},
	
	addToAllWindows() {
		var windows = Zotero.getMainWindows();
		for (let win of windows) {
			if (!win.ZoteroPane) continue;
			this.addToWindow(win);
		}
	},
	
	removeFromWindow(window) {
		this.log("Removing from window");
	},
	
	removeFromAllWindows() {
		var windows = Zotero.getMainWindows();
		for (let win of windows) {
			if (!win.ZoteroPane) continue;
			this.removeFromWindow(win);
		}
	},
	
	async main() {
		this.log("Main routine started");
	},
};
