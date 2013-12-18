var activateKey = "alt"

var data = require("sdk/self").data;
var tabs = require("sdk/tabs");

var lru = require("./lru.js");
var tabCache = new lru.LRUCache(10);
for each (var tab in tabs)
{
    tabCache.put(tab.id, tab);
}
var tabOrder = [];

var panel = require("sdk/panel").Panel({
    //width: 640,
    //height: 480,
    contentURL: data.url("tab-list.html"),
    contentScriptFile: data.url("manage-tabs.js")
});

panel.on("show", function() {
    var tabList = [];
    tabCache.forEach(function(key, value) {
        tabList.push({id: value.id, url: value.url, 
            title: value.title});
    }, true);

    panel.port.emit("show", tabList);
});

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

panel.port.on("dismissPanel", function (selectedTabId) {
  panel.hide();
  console.log("dismissing, selection is " + selectedTabId);
  tabCache.find(selectedTabId).value.activate();
});

panel.port.on("resize", function ({width, height}) {
    panel.resize(width, height);
});


function onOpen(tab) {
    console.log(tab.url + " is open");
    tab.on("pageshow", logShow);
    tab.on("activate", logActivate);
    tab.on("deactivate", logDeactivate);
    tab.on("close", logClose);
}

function logShow(tab) {
    console.log(tab.url + " is loaded");
}

function onActivate(tab) {
    if (tabCache.get(tab.id) === undefined) {
        tabCache.put(tab.id, tab);
    }
    console.log(tab.id + " is active.");
    console.log(tabCache.toString());
}

function onDeactivate(tab) {
}

function onClose(tab) {
    tabCache.remove(tab.id);
}

tabs.on('show', logShow);
tabs.on('activate', onActivate);
tabs.on('close', onClose);
