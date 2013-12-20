var selectedIndex = 0;
var rowCount = 0;
var rows = [];
var tabList = [];

function onKeyUp(event)
{
    //lazy way to determine keyup - 17 is ctrl, 18 is alt
    if (event.keyCode === 17 || event.keyCode === 18) {
        self.port.emit("dismissPanel", tabList[selectedIndex].id);
        window.removeEventListener("keyup", onKeyUp, false);

    }
}

self.port.on("show", function onShow(tabLst, reverse) {
    tabList = tabLst;
    createTable(reverse);
    window.addEventListener("keyup", onKeyUp, false);
    window.focus();
});

function createTable(reverse)
{
    var old_tbody = document.getElementById("tabTable").getElementsByTagName('tbody')[0];
    var new_tbody = document.createElement('tbody');
    var count = 0;
    for each (var tab in tabList)
    {
        var row = new_tbody.insertRow(count);
        var cell = row.insertCell(0);
        element = document.createTextNode(tab.title);
        cell.appendChild(element);

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

