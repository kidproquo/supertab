var selectedIndex = 0;
var rowCount = 0;
var rows = [];
var tabList = [];

function onKeyUp(event)
{
    if (event.keyCode === 18) { //TOOD: remove hardcoded number
        self.port.emit("dismissPanel", tabList[selectedIndex].id);
        window.removeEventListener("keyup", onKeyUp, false);

    }
}

self.port.on("show", function onShow(tabLst) {
    console.log("show triggered");
    tabList = tabLst;
    createTable();
    window.addEventListener("keyup", onKeyUp, false);
    window.focus();
});

function createTable()
{
    var old_tbody = document.getElementById("tabTable").getElementsByTagName('tbody')[0];
    var new_tbody = document.createElement('tbody');
    var count = 0;
    for each (var tab in tabList)
    {
        var row = new_tbody.insertRow(count);
        var cell = row.insertCell(0);
        var element = document.createElement("img");
        //element.src = tab.icon;
        cell.appendChild(element);

        cell = row.insertCell(1);
        element = document.createElement("label");
        element.innerHTML = tab.title;
        cell.appendChild(element);

        cell = row.insertCell(2);
        element = document.createElement("label");
        element.innerHTML = tab.url;
        cell.appendChild(element);

        count++;

    }
    old_tbody.parentNode.replaceChild(new_tbody, old_tbody);
    selectedIndex = count > 1 ? 1 : 0;
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
    if (rows.length === 0)
{
    return;
}

console.log("length: " + rows.length);
if (rows.length === 1)
{
    selectedIndex = 0;
    rows[0].className = 'highlighted';
    return;
}

var prevIndex = selectedIndex;
selectedIndex++;
if (selectedIndex === rowCount)
{
    selectedIndex = 0;
}
rows[selectedIndex].className = 'highlighted';
rows[prevIndex].className = '';
});

