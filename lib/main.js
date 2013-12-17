var activateKey = "alt"

var data = require("sdk/self").data;
var tabs = require("sdk/tabs");

var lru = require("./lru.js");
var tabCache = new lru.LRUCache(10);
var tabOrder = [];

var panel = require("sdk/panel").Panel({
    width: 640,
    height: 480,
    contentURL: data.url("tab-list.html"),
    contentScriptFile: data.url("manage-tabs.js")
});

panel.on("show", function() {
    var tabList = [];
    tabCache.forEach(function(key, value) {
        console.log(key);
        tabList.push({id: value.id, url: value.url, 
            title: value.title, icon: value.favicon});
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

panel.port.on("dismiss", function (selectedIndex) {
  panel.hide();
  tabs[selectedIndex].activate();
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
    tabCache.remove(tab.id);
    tabCache.put(tab.id, tab);
}

function logDeactivate(tab) {
    console.log(tab.url + " is deactivated");
}

function onClose(tab) {
    tabCache.remove(tab.id);
}

tabs.on('activate', onActivate);
tabs.on('close', onClose);
