/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 * Contributor: Prince Samuel (prince.samuel@gmail.com)
 * */

//get the user preferences
var activateKey = require('sdk/simple-prefs').prefs['activateKey'];
var maxTabs = require('sdk/simple-prefs').prefs['maxTabs'];
var activatePrevious = require('sdk/simple-prefs').prefs['activatePrevious'];

var data = require("sdk/self").data;
var windows = require("sdk/windows");
var utils = require('sdk/window/utils');
var tabs = require("sdk/tabs");
let { getFavicon } = require("sdk/places/favicon");

var lru = require("./lru");
var tabCache = new lru.LRUCache(maxTabs);

var curWinId = utils.getOuterId(utils.getMostRecentBrowserWindow());
var allWindowTabCache = {};
var favIconCache = {};

var panel;
var panelVisible = false;

allWindowTabCache[curWinId] = tabCache;

function initTabCache(activeWindow) {
    for each (var tab in activeWindow.tabs) {
        tabCache.put(tab.id, tab);
        favIconCache[tab.id] = "favIconPlaceholder.png";
    }
}
initTabCache(windows.browserWindows.activeWindow);


function initPanel() {
    panel = require("sdk/panel").Panel({
        contentURL: data.url("tab-list.html"),
          contentScriptFile: data.url("manage-tabs.js")
    });

    panel.on("show", function () {
        panelVisible = true;
        //emit event to register keyboard listener
        panel.port.emit("show");
    });

    panel.on("hide", function () {
        panelVisible = false;
    });

    panelVisible = false;
    panel.port.on("dismissPanel", function (selectedTabId) {
        panel.hide();
        tabCache.find(selectedTabId).value.activate();
    });

    panel.port.on("resize", function ({width, height}) {
        //magic numbers alert!
        //the 20 pixel offset to the height is due to 
        //somehow the body height returned by the content script
        //not being correct
        panel.resize(480, height + 20); 
        panel.show();
    });
}
initPanel();

// Define keyboard shortcuts for showing/hiding the custom panel 
var { Hotkey } = require("sdk/hotkeys");

var showHotKey = Hotkey({
    combo: activateKey + "-tab",
    onPress: function() {
        if (!panelVisible) {
            createPanelDOM(false);
            return;
        }
    }
});

var hideHotKey = Hotkey({
    combo: activateKey + "-shift-tab",
    onPress: function() {
        if (!panelVisible) {
            createPanelDOM(true);
            return;
        }
    }
});

/** function creates the tab-list panel's DOM
 * The reverse flag indicates if the shift-key modifier
 * has been used - if reverse is true then highlight
 * the last tab in the MRU list, otherwise highlight the next tab
 **/
function createPanelDOM(reverse) {
    var tabList = [];
    tabCache.forEach(function(key, value) {
        tabList.push({id: value.id, url: value.url, 
            title: value.title, icon: favIconCache[value.id]});
    }, true);

    panel.port.emit("create", tabList, reverse);
}

tabs.on('open', onOpenTab);
function onOpenTab(tab) {
    favIconCache[tab.id] = "favIconPlaceholder.png";
    var winId = utils.getOuterId(utils.getMostRecentBrowserWindow());
    //sanity check. when a new window gets opened, the new tab activate event gets fired before the open window event
    if (winId !== curWinId) {
        return;
    }
    tabCache.sneakIn(tab.id, tab);
}

tabs.on('activate', onActivateTab);
function onActivateTab(tab) {
    tabCache.get(tab.id);
    getFavicon(tab).then(
            function(url) {
                favIconCache[tab.id] = url;
            });
}

tabs.on('close', onCloseTab);
function onCloseTab(tab) {
    tabCache.remove(tab.id);
    favIconCache[tab.id] = undefined;

    if (!activatePrevious) {
        return;
    }

    var prevTab = tabCache.MRU();
    if (prevTab !== undefined) {
        prevTab.activate();
    }
}

tabs.on('load', onLoadTab);
function onLoadTab(tab) {
    getFavicon(tab).then(
            function(url) {
                favIconCache[tab.id] = url;
            });
}

windows.browserWindows.on('activate', onActivateWindow);
function onActivateWindow(win) {
    curWinId = utils.getOuterId(utils.getMostRecentBrowserWindow());
    tabCache = allWindowTabCache[curWinId];
    panel.destroy();
    initPanel();
}

windows.browserWindows.on('open', onOpenWindow);
function onOpenWindow(win) {
    curWinId = utils.getOuterId(utils.getMostRecentBrowserWindow());
    allWindowTabCache[curWinId]= new lru.LRUCache(maxTabs);
    tabCache = allWindowTabCache[curWinId];
    initTabCache(win);
}

