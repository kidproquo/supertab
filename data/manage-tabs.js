/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 * Contributor: Prince Samuel (prince.samuel@gmail.com)
 * */

var selectedIndex = 0;
var rowCount = 0;
var rows = [];
var tabList = [];
var maxTitleLength = 50;

function onKeyUp(event)
{
    //lazy way to determine keyup - 17 is ctrl, 18 is alt
    if (event.keyCode === 17 || event.keyCode === 18) {
        self.port.emit("dismissPanel", tabList[selectedIndex].id);
        window.removeEventListener("keyup", onKeyUp, false);

    }
}

self.port.on("show", function onShow() {
    window.addEventListener("keyup", onKeyUp, false);
    window.focus();
});

self.port.on("create", function onShow(tabLst, reverse) {
    tabList = tabLst;
    createTable(reverse);
});

function createTable(reverse)
{
    var old_tbody = document.getElementById("tabTable").getElementsByTagName('tbody')[0];
    var new_tbody = document.createElement('tbody');
    var count = 0;
    var title = "";
    for each (var tab in tabList)
    {
        var row = new_tbody.insertRow(count);
        var cell = document.createElement('td'); 
        var element = document.createElement("img");
        element.src = tab === undefined || tab.icon === undefined 
            ?  "favIconPlaceholder.png" : tab.icon;
        element.style.height = "16px";
        cell.appendChild(element);
        cell.style.width = "16px";
        row.appendChild(cell);

        cell = document.createElement('td'); //row.insertCell(1);
        title = tab === undefined || tab.title === undefined 
            ?  "" : tab.title;
        if (title.length > maxTitleLength) {
            title = title.substring(0, maxTitleLength) + " ...";
        }
        element = document.createTextNode(title);
        cell.appendChild(element);
        row.appendChild(cell);

        count++;

    }
    old_tbody.parentNode.replaceChild(new_tbody, old_tbody);
    selectedIndex = count > 1 ? reverse?count-1:1 : 0;
    rowCount = count;
    rows = new_tbody.getElementsByTagName('tr');
    if (rows.length > 0) {
        rows[selectedIndex].className = 'highlighted';
    }

    self.port.emit('resize', 
            { width: document.documentElement.clientWidth, 
                height: document.documentElement.clientHeight });
}

self.port.on("cycleTabs", function onCycleTabs() {
    CycleTabs(false);
});

self.port.on("cycleTabsReverse", function onCycleTabs() {
    CycleTabs(true);
});

function CycleTabs(reverse) {

    if (rows.length === 0) {
        return;
    }

    if (rows.length === 1) {
        selectedIndex = 0;
        rows[0].className = 'highlighted';
        return;
    }

    var prevIndex = selectedIndex;

    reverse ? selectedIndex-- :selectedIndex++;
    if (selectedIndex === rowCount) {
        selectedIndex = 0;
    }

    if (selectedIndex == -1) {
        selectedIndex = rowCount - 1;
    }

    rows[selectedIndex].className = 'highlighted';
    rows[prevIndex].className = '';

}

