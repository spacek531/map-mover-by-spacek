/// <reference path="C:/Users/Ted/Documents/GitHub/openrct2/distribution/openrct2.d.ts" />
/// <reference types="C:/Users/Ted/Documents/GitHub/openrct2/distribution/openrct2.d.ts" />

// written by Spacek 2020-4-26

/* Reference values */

var MAPMOVER_ACTUATE = "spacek.map_mover";

var TOPBAR_HEIGHT = 15;
var OverallHeight = TOPBAR_HEIGHT; // updated as the ui is built (like a vBox)
var OverallWidth = 270; //fixed

var MAP_BORDER_SIZE = 1
var PIXELS_PER_TILE = 16

var Window;
var Widgets;

/* Current parameters */

var selectedXOffset = 0
var selectedYOffset = 0
var lastMapSizeX = 0
var lastMapSizeY = 0

function GetWidget(widget) {
    if (Window) {
        return Window.findWidget(widget.name);
    }
}
function GetWidgetByName(name) {
    if (Window) {
        return Window.findWidget(name);
    }
}
/* Get real widgets */

function GetWidget(widget) {
    if (Window) {
        return Window.findWidget(widget.name);
    }
}
function GetWidgetByName(name) {
    if (Window) {
        return Window.findWidget(name);
    }
}

/* Widget update functions */

function updateSpinner(widget, value, axis) {
    if (!widget) { return;}
    widget.text = "move " +axis+ " by "+ value + " tile" + (Math.abs(value/2) == 1 ? "" : "s");
}

/* Perform the work */

function moveTheMap(manifest) {
    var XSwap = []; //  region on the right side of the map
    var YSwap = []; //  region on the top side of the map
    var XYSwap = []; // region at the top-right side of the map
    
    // fill the X swap array
    for (var x = 0; x < manifest.x; x++) {
        for (var y = MAP_BORDER_SIZE; y < map.size.y - MAP_BORDER_SIZE - manifest.y; y++) {
            var tile = map.getTile(x + map.size.x - MAP_BORDER_SIZE - manifest.x, y);
            if (tile) {
                XSwap.push(tile.data);
            }
        }
    }
    // fill the Y swap array
    for (var x = MAP_BORDER_SIZE; x < map.size.x - MAP_BORDER_SIZE - manifest.x; x++) {
        for (var y = 0; y < manifest.y; y++) {
            var tile = map.getTile(x, y + map.size.y - MAP_BORDER_SIZE - manifest.y);
            if (tile) {
                YSwap.push(tile.data);
            }
        }
    }
    // fill the XY swap array
    for (var x = 0; x < manifest.x; x++) {
        for (var y = 0; y < manifest.y; y++) {
            var tile = map.getTile(x + map.size.x - MAP_BORDER_SIZE - manifest.x, y + map.size.y - MAP_BORDER_SIZE - manifest.y);
            if (tile) {
                XYSwap.push(tile.data);
            }
        }
    }
    
    // shift all tiles
    for (var x = map.size.x - MAP_BORDER_SIZE - 1; x >= manifest.x+MAP_BORDER_SIZE; x--) {
        for (var y = map.size.y - MAP_BORDER_SIZE - 1; y >= manifest.y+MAP_BORDER_SIZE; y--) {
            var newTile = map.getTile(x,y);
            var oldTile = map.getTile(x-manifest.x,y-manifest.y);
            for (var i = 0; i < oldTile.numElements; i++) {
                newTile.data = oldTile.data;
            }
        }
    }
    // apply X swap
    for (var x = 0; x < manifest.x; x++) {
        for (var y = 0; y < map.size.y - MAP_BORDER_SIZE*2 - manifest.y; y++) {
            var tile = map.getTile(x + MAP_BORDER_SIZE, y + MAP_BORDER_SIZE + manifest.y);
            if (tile) {
                tile.data = XSwap[x*(map.size.y - MAP_BORDER_SIZE*2 - manifest.y) + y];
            }
        }
    }
    // apply Y swap
    for (var x = 0; x < map.size.x - MAP_BORDER_SIZE*2 - manifest.x; x++) {
        for (var y = 0; y < manifest.y; y++) {
            var tile = map.getTile(x + MAP_BORDER_SIZE + manifest.x, y + MAP_BORDER_SIZE);
            if (tile) {
                tile.data = YSwap[x*manifest.y + y];
            }
        }
    }
    // apply XY swap
    for (var x = 0; x < manifest.x; x++) {
        for (var y = 0; y < manifest.y; y++) {
            var tile = map.getTile(x + MAP_BORDER_SIZE, y + MAP_BORDER_SIZE);
            if (tile) {
                tile.data = XYSwap[x*manifest.y + y];
            }
        }
    }
    /*
    for (var i = 0; i < map.numEntities; i++) {
        var entity = map.getEntitiy(i);
        entity.x = MAP_BORDER_SIZE*PIXELS_PER_TILE + (entity.x - MAP_BORDER_SIZE * PIXELS_PER_TILE + manifest.x * PIXELS_PER_TILE)%((map.size.x - MAP_BORDER_SIZE*2) * PIXELS_PER_TILE)
        entity.y = MAP_BORDER_SIZE*PIXELS_PER_TILE + (entity.y - MAP_BORDER_SIZE * PIXELS_PER_TILE + manifest.y * PIXELS_PER_TILE)%((map.size.y - MAP_BORDER_SIZE*2) * PIXELS_PER_TILE)
    }
    */
    //todo: fix ride station tile references
    //todo: fix ride entrance tile references
    //todo: fix park entrance tile references
}

function queryOrExecuteAction(manifest, execute) {
    if (manifest.x == 0 && manifest.y == 0) {
        return {
            error: 1,
            errorTitle: "No offset selected"
        };
    } else if (selectedXOffset > map.size.x - MAP_BORDER_SIZE*2) {
        return {
            error: 1,
            errorTitle: "X offset is larger than map"
        }
    } else if (selectedYOffset > map.size.y - MAP_BORDER_SIZE*2) {
        return {
            error: 1,
            errorTitle: "Y offset is larger than map"
        }
    }
    if (execute) {
        moveTheMap(manifest);
    }
    return {};
}

function getManifest() { // simplifies execution by changing negative values to equivalent positive values
    var manifest = {
        x: selectedXOffset,
        y: selectedYOffset
    };
    if (selectedXOffset < 0) {
        manifest.x =  selectedXOffset - (map.size.x - MAP_BORDER_SIZE*2);
    }
    if (selectedYOffset < 0) {
        manifest.y =  selectedYOffset - (map.size.y - MAP_BORDER_SIZE*2);
    }
    return manifest;
}

function checkMapSizeChanged() { // limits spinner so that client cannot go past map borders
    if (map.size.x != lastMapSizeX || map.size.y != lastMapSizeY) {
        lastMapSizeX = map.size.x;
        lastMapSizeY = map.size.y;
        
        if (selectedXOffset < -(map.size.x - 1 - MAP_BORDER_SIZE*2)) {
            selectedXOffset = -(map.size.x - 1 - MAP_BORDER_SIZE*2);
            updateSpinner(GetWidgetByName("xOffsetWidget"),selectedXOffset,"X");
        }
        else if (selectedXOffset > map.size.x - 1 - MAP_BORDER_SIZE*2) {
            selectedXOffset = map.size.x - 1 - MAP_BORDER_SIZE*2;
            updateSpinner(GetWidgetByName("xOffsetWidget"),selectedXOffset,"X");
        }
        
        if (selectedYOffset < -(map.size.y - 1 - MAP_BORDER_SIZE*2)) {
            selectedYOffset = -(map.size.y - 1 - MAP_BORDER_SIZE*2);
            updateSpinner(GetWidgetByName("yOffsetWidget"),selectedYOffset,"Y");
        }
        else if (selectedYOffset > map.size.y - 1 - MAP_BORDER_SIZE*2) {
            selectedYOffset = map.size.y - 1 - MAP_BORDER_SIZE*2;
            updateSpinner(GetWidgetByName("yOffsetWidget"),selectedYOffset,"Y");
        }
    }
}

/* Create the UI */

function createWidgets() {
    Widgets = [];
    
    // changing height or deleting
    
    // min and max heights
    var boundsChangeGroupBox = {
        type : "groupbox",
        text : "Offset X and Y",
        x : 0,
        y : OverallHeight,
        width : OverallWidth,
        height : 0
    }
    var xOffsetWidget = {
        name : "xOffsetWidget",
        type : "spinner",
        x : 5,
        y : OverallHeight + 12,
        width : OverallWidth/2 - 10,
        height : 12,
        text : "asdf",
        value : 0,
        onDecrement: function() {
            if (selectedXOffset <= -(map.size.x - 1 - MAP_BORDER_SIZE*2)) {
                selectedXOffset = map.size.x - 1 - MAP_BORDER_SIZE*2;
            }
            else {
                selectedXOffset--;
            }
            updateSpinner(GetWidget(xOffsetWidget),selectedXOffset,"X");
        },
        onIncrement: function() {
            if (selectedXOffset >= map.size.x - 1 - MAP_BORDER_SIZE*2) {
                selectedXOffset = -(map.size.x - 1 - MAP_BORDER_SIZE*2);
            }
            else {
                selectedXOffset++;
            }
            updateSpinner(GetWidget(xOffsetWidget),selectedXOffset,"X");
        },
    }
    var yOffsetWidget = {
        name : "yOffsetWidget",
        type : "spinner",
        x : OverallWidth/2 + 5,
        y : OverallHeight + 12,
        width : OverallWidth/2 - 10,
        height : 12,
        text : "asdf",
        value : 0,
        onDecrement: function() {
            if (selectedYOffset <= -(map.size.y - 1 - MAP_BORDER_SIZE*2)) {
                selectedYOffset = map.size.y - 1 - MAP_BORDER_SIZE*2;
            }
            else {
                selectedYOffset--;
            }
            updateSpinner(GetWidget(yOffsetWidget),selectedYOffset,"Y");
        },
        onIncrement: function() {
            if (selectedYOffset >= map.size.y - 1 - MAP_BORDER_SIZE*2) {
                selectedYOffset = -(map.size.y - 1 - MAP_BORDER_SIZE*2);
            }
            else {
                selectedYOffset++;
            }
            updateSpinner(GetWidget(yOffsetWidget),selectedYOffset,"Y");
        },
    }
    boundsChangeGroupBox.height = yOffsetWidget.height + 12 + 5;
    Widgets.push(boundsChangeGroupBox);
    Widgets.push(yOffsetWidget);
    Widgets.push(xOffsetWidget);
    
    OverallHeight = boundsChangeGroupBox.y + boundsChangeGroupBox.height;
    
    //below the checkboxes
    
    var warningGroup = {
        type : "groupbox",
        x : 0,
        y : OverallHeight,
        width : OverallWidth,
        height : 0
    }
    
    var warningLabel = {
        type : "label",
        text : "Before use, you must DELETE every instance of\nthe following:\n - ride stations\n - ride entrance huts\n - tower rides\n - park entrances\n - peeps\n - ride cars\nFAILURE to do so will result in non-working rides\nand park entrances, peeps falling into the void,\nand crashing ride cars. These must be re-built\nafter you are satisfied with the new position.",
        x : 5,
        y : OverallHeight + 10,
        width : OverallWidth - 10,
        height : 120
    }
    warningGroup.height = warningLabel.height + 15;
    OverallHeight = warningGroup.y + warningGroup.height;
    Widgets.push(warningGroup);
    Widgets.push(warningLabel);
    
    var applyButton = {
        type : "button",
        text : "Apply",
        width : 100,
        height : 30,
        x : 5,
        y : OverallHeight + 5,
        onClick : function() {
            context.executeAction(MAPMOVER_ACTUATE, getManifest());
        }
    }
    Widgets.push (applyButton);
    
    var resetButton = {
        type : "button",
        text : "Reset offsets",
        width : 100,
        height : 30,
        x : OverallWidth-105,
        y : OverallHeight + 5,
        onClick : function() {
            selectedXOffset = 0;
            selectedYOffset = 0;
            updateSpinner(GetWidgetByName("xOffsetWidget"),selectedXOffset,"X");
            updateSpinner(GetWidgetByName("yOffsetWidget"),selectedYOffset,"Y");
        }
    }
    Widgets.push (applyButton);
    Widgets.push (resetButton);
    OverallHeight = applyButton.y + applyButton.height + 5;
}

/* Getting the plugin to open */

function openWindow() {
    Window = ui.getWindow("MapMover_window");
    if (Window) {
        Window.bringToFront();
        return;
    }
    
    Window = ui.openWindow({
        classification: "MapMover_window",
        title: "Map Mover",
        x: 100,
        y: 100,
        width: OverallWidth,
        height: OverallHeight,
        widgets: Widgets,
    });
    updateSpinner(GetWidgetByName("xOffsetWidget"),selectedXOffset,"X");
    updateSpinner(GetWidgetByName("yOffsetWidget"),selectedYOffset,"Y");
}

var main = function () {

    context.registerAction(MAPMOVER_ACTUATE,
        function(manifest) { return queryOrExecuteAction(manifest, false); },
        function(manifest) { return queryOrExecuteAction(manifest, true); });

    if (typeof ui === 'undefined') {
        return;
    }

    ui.registerMenuItem("Map Mover", function() {
        openWindow();
    });
    
    context.subscribe("interval.tick",checkMapSizeChanged);
    
    createWidgets();
};

registerPlugin({
    name: 'Map Mover by Spacek',
    version: '1.0',
    authors: ['Spacek'],
    type: 'remote',
    main: main
});