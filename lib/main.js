var activateKey = "alt"
var maxTabs = 10;

var data = require("sdk/self").data;
var windows = require("sdk/windows");
var utils = require('sdk/window/utils');
var tabs = require("sdk/tabs");
let { getFavicon } = require("sdk/places/favicon");

var lru = require("./lru.js");
var tabCache = new lru.LRUCache(maxTabs);
var curWinId = utils.getOuterId(utils.getMostRecentBrowserWindow());
var allWindowTabCache = {};
allWindowTabCache[curWinId] = tabCache;

function initTabCache(activeWindow) {
    for each (var tab in activeWindow.tabs) {
        tabCache.put(tab.id, tab);
    }
}

initTabCache(windows.browserWindows.activeWindow);

var panel;

function initPanel() {
    panel = require("sdk/panel").Panel({
        //width: 640,
        //height: 480,
        contentURL: data.url("tab-list.html"),
          contentScriptFile: data.url("manage-tabs.js")
    });
    panel.on("show", onPanelShow);

    panel.port.on("dismissPanel", function (selectedTabId) {
        panel.hide();
        tabCache.find(selectedTabId).value.activate();
    });

    panel.port.on("resize", function ({width, height}) {
        panel.resize(width, height);
    });

}
initPanel();

function onPanelShow() {
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

tabs.on('open', onOpenTab);
function onOpenTab(tab) {
    var winId = utils.getOuterId(utils.getMostRecentBrowserWindow());
    if (winId != curWinId) {
        return;
    }
    //console.log("tab opened for window "  + curWinId);
    tabCache.put(tab.id, tab);
}

tabs.on('activate', onActivateTab);
function onActivateTab(tab) {
    tabCache.get(tab.id);
}

tabs.on('close', onCloseTab);
function onCloseTab(tab) {
    tabCache.remove(tab.id);
}

windows.browserWindows.on('activate', onActivateWindow);
function onActivateWindow(win) {
    curWinId = utils.getOuterId(utils.getMostRecentBrowserWindow());
    tabCache = allWindowTabCache[curWinId];
    panel.destroy();
    initPanel();
    console.log("window cache " + tabCache) ;
}

windows.browserWindows.on('open', onOpenWindow);
function onOpenWindow(win) {
    curWinId = utils.getOuterId(utils.getMostRecentBrowserWindow());
    allWindowTabCache[curWinId]= new lru.LRUCache(maxTabs);
    tabCache = allWindowTabCache[curWinId];
    initTabCache(win);
    console.log("tab cache init for curWinId " + curWinId) ;

}




/*
 *windows.browserWindows.on('close', onCloseWindow);
 *function onCloseWindow(win) {
 *
 *
 *}
 */
