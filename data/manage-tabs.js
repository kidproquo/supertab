var selectedIndex = 0;
var rowCount = 0;
var rows = [];

self.port.on("show", function onShow(tabList) {
    createTable(tabList);
    window.addEventListener("keyup", function(event)
    {
        if (event.keyCode === 18) { //TOOD: remove hardcoded number
            self.port.emit("dismiss", selectedIndex)
        }
    }, false);
    window.focus();
});

function createTable(tabList)
{
    var old_tbody = document.getElementById("tabTable").getElementsByTagName('tbody')[0];
    var new_tbody = document.createElement('tbody');
    var count = 0;
    for each (var tab in tabList)
    {
        var row = new_tbody.insertRow(count);
        var cell = row.insertCell(0);
        var element = document.createElement("img");
        element.src = tab.icon;
        cell.appendChild(element);

        cell = row.insertCell(1);
        element = document.createElement("label");
        element.innerHTML = tab.title;
        cell.appendChild(element);

        cell = row.insertCell(2);
        element = document.createElement("label");
        element.innerHTML = tab.url;
        cell.appendChild(element);

        if (count == 0)
        {
            row.className = 'highlighted';
        }

        count++;

    }
    old_tbody.parentNode.replaceChild(new_tbody, old_tbody);
    selectedIndex = 0;
    rowCount = count;
    rows = new_tbody.getElementsByTagName('tr');
}

self.port.on("cycleTabs", function onCycleTabs() {
    var prevIndex = selectedIndex;
    selectedIndex++;
    if (selectedIndex === rowCount)
    {
        selectedIndex = 0;
    }
//i   if (rows.length == 0)
    //{
        //return;
    //}
    rows[selectedIndex].className = 'highlighted';
    rows[prevIndex].className = '';
});

