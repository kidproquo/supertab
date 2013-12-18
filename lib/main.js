var activateKey = "alt"

var data = require("sdk/self").data;
var windows = require("sdk/windows");
var tabs = require("sdk/tabs");
let { getFavicon } = require("sdk/places/favicon");

var lru = require("./lru.js");
var tabCache = new lru.LRUCache(10);

function InitTabCache() {
    for each (var tab in windows.browserWindows.activeWindow.tabs) {
        tabCache.put(tab.id, tab);
    }
    console.log(tabCache.toString());
}

InitTabCache();

var panel;

function InitPanel() {
    panel = require("sdk/panel").Panel({
        //width: 640,
        //height: 480,
        contentURL: data.url("tab-list.html"),
          contentScriptFile: data.url("manage-tabs.js")
    });
    panel.on("show", OnShow);

    panel.port.on("dismissPanel", function (selectedTabId) {
        panel.hide();
        tabCache.find(selectedTabId).value.activate();
    });

    panel.port.on("resize", function ({width, height}) {
        panel.resize(width, height);
    });

}
InitPanel();

function OnShow() {
    var tabList = [];
    tabCache.forEach(function(key, value) {
        tabList.push({id: value.id, url: value.url, 
            title: value.title, icon: getFavicon(value)});
    }, true);

    panel.port.emit("show", tabList);
}


// Define keyboard shortcuts for showing and hiding a custom panel.
var { Hotkey } = require("sdk/hotkeys");

var showHotKey = Hotkey({
    combo: activateKey + "-tab",
    onPress: function() {
        panel.show();
        panel.port.emit("cycleTabs");
    }
});
var hideHotKey = Hotkey({
    combo: activateKey + "-shift-tab",
    onPress: function() {
        panel.hide();
    }
});

function onActivate(tab) {
    if (tabCache.get(tab.id) === undefined) {
        tabCache.put(tab.id, tab);
    }
}

function onClose(tab) {
    tabCache.remove(tab.id);
}

tabs.on('activate', onActivate);
tabs.on('close', onClose);

windows.browserWindows.on('activate', onActivateWindow);
function onActivateWindow(window) {
    tabCache.removeAll();
    InitTabCache();
    panel.destroy();
    InitPanel();
}

