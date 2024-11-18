let container;
let width;
let height;
let backgroundLayer;
let imageLayer;
let textLayer;
let layer1;
let layer2;

let stage;
//Globals
let scaleBy = 1.1;
//default Label Settings
let userLabelConfig = {
    x: 0,
    y: 0,
    width: 400,
    height: 600,
    strokeWidth: 1,
    labelsPerRow: 5,
    padding: 10,
    labelCount: 0,
    labelSize: 'custom', // default label size
    labelSpacing: 10,
    labelBorderWidth: 1,
    labelBorderColor: 'black',
    labelBorderStyle: 'solid',
    labelBorderRadius: 0,
    labelBackgroundColor: 'white',
    zoomSensitivity: 1.1,
    maxZoom: 1.5, // default max zoom level
};
let LabelCount = 0;

//functions
function createLabel(positionalData) {
    LabelCount++;
    labelMap.set('Label' + LabelCount, config);
    let label = new Konva.Rect({
        x: positionalData.x ?? userLabelConfig.x,
        y: positionalData.y ?? userLabelConfig.y,
        width: userLabelConfig.width,
        height: userLabelConfig.height,
        fill: userLabelConfig.labelBackgroundColor,
        stroke: userLabelConfig.labelBorderColor,
        draggable: false,
        id: 'Label' + LabelCount,
        class: 'Label',
    });

    label.on('dblclick dbltap', () => {
        var labelPosition = label.getAbsolutePosition();
        var stageBox = stage.container().getBoundingClientRect();
        var areaPosition = {
            x: stageBox.left + labelPosition.x,
            y: stageBox.top + labelPosition.y
        };
        var innerKonvacanvas = document.createElement('canvas');
        document.body.appendChild(innerKonvacanvas);

        innerKonvacanvas.style.position = 'absolute';
        innerKonvacanvas.style.top = areaPosition.y + 'px';
        innerKonvacanvas.style.left = areaPosition.x + 'px';
        innerKonvacanvas.style.width = userLabelConfig.width + 'px';
        innerKonvacanvas.style.height = userLabelConfig.height + 'px';

        innerKonvacanvas.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                innerKonvacanvas.remove();
            }
        });
        
    });
    return label;
}

function addLabel() {
    let x, y;
    let labelsPerRow = userLabelConfig.labelsPerRow ?? 5;
    let padding = userLabelConfig.padding ?? 10;
    let labelWidth = userLabelConfig.width;
    let labelHeight = userLabelConfig.height;
    // Current label's column (0-based)
    let columnIndex = LabelCount % labelsPerRow;

    // Current label's row (0-based)
    let rowIndex = Math.floor(LabelCount / labelsPerRow);

    // Calculate the x position: columnIndex * (label width + padding)
    x = columnIndex * (labelWidth + padding);

    // Calculate the y position: rowIndex * (label height + padding)
    y = rowIndex * (labelHeight + padding);

    // Add the label to the canvas at the calculated x and y
    backgroundLayer.add(createLabel({ x: x, y: y }));
}

function removeLabel(config) {
    let label = Konva.findOne('#' + config.id);
    if (label) {
        label.destroy();
    }
}

//width sliders
$(document).ready(function () {
    $('#labelSize').val(userLabelConfig.labelSize);

    // Custom Label Size
    $('#labelWidth').val(userLabelConfig.width);
    $('#labelHeight').val(userLabelConfig.height);

    // Label Spacing
    $('#labelSpacing').val(userLabelConfig.labelSpacing);
    $('#labelSpacingValue').val(userLabelConfig.labelSpacing);

    // Label Border Settings
    $('#labelBorderWidth').val(userLabelConfig.labelBorderWidth);
    $('#labelBorderWidthValue').val(userLabelConfig.labelBorderWidth);
    $('#labelBorderColor').val(userLabelConfig.labelBorderColor);
    $('#labelBackgroundColor').val(userLabelConfig.labelBackgroundColor);
    $('#labelBorderStyle').val(userLabelConfig.labelBorderStyle);
    $('#labelBorderRadius').val(userLabelConfig.labelBorderRadius);

    // Labels per row
    $('#labelsPerRow').val(userLabelConfig.labelsPerRow);

    // Editor Settings
    $('#editorBackgroundColor').val(userLabelConfig.fill);
    $('#editorZoomSensitivity').val(userLabelConfig.zoomSensitivity);
    $('#editorZoomSensitivityValue').val(userLabelConfig.zoomSensitivity);
    $('#editorMaxZoom').val(userLabelConfig.maxZoom);
    $('#editorMaxZoomValue').val(userLabelConfig.maxZoom);

    let target = null;
    let isHandlerDragging = false;

    $(document).on('mousedown', '.resize-bar-v', function (e) {
        isHandlerDragging = true;
        target = $(this).attr('data-krus-target');
        e.preventDefault(); // Prevent default action
    });

    $(document).on('mousemove', function (e) {
        if (!isHandlerDragging) {
            return;
        }

        if (target) {
            let temptarget = target;
            console.log(target);
            if (target.split('|').length != 1) {
                temptarget = target.split('|')[0];
            }
            const minWidth = 200; // Minimum width of the target element
            let offset; // Get the target element's left offset
            const pointerPosition = e.clientX;
            let newWidth;
            if (temptarget == '#innerLeft') {
                offset = $(temptarget).offset().left;
                newWidth = Math.min(500, Math.max(minWidth, pointerPosition - offset));
            } else if (temptarget == '#innerRight') {
                offset = document.getElementById(temptarget.replace('#', '')).getBoundingClientRect().right;
                newWidth = Math.min(500, Math.max(minWidth, offset - pointerPosition) - 20);
            }
            // Get the current pointer position

            // Resize the target element based on the pointer position
            if (target.split('|').length == 1) {
                $(temptarget).css('width', newWidth + 'px');
            } else {
                let bodyStyles = window.getComputedStyle(document.body);
                let innermargin = bodyStyles.getPropertyValue('--inner-margin');
                $(target.split('|')[0]).css('width', newWidth + 'px');
                $(target.split('|')[1]).css('width', newWidth - innermargin.replace('px', '') * 2 + 'px');
                console.log('width', newWidth - innermargin.replace('px', '') * 2 + 'px');
            }
        }
    });

    $(document).on('mouseup', function () {
        isHandlerDragging = false;
        target = null; // Clear the target when mouse is released
    });

    $(document).on('touchstart', '.resize-bar-v', function (e) {
        isHandlerDragging = true;
        target = $(this).attr('data-krus-target');
        e.preventDefault(); // Prevent default action
    });

    $(document).on('touchmove', function (e) {
        if (!isHandlerDragging) {
            return;
        }

        if (target) {
            let temptarget = target;
            if (target.split('|').length != 1) {
                temptarget = target.split('|')[0];
            }
            const minWidth = 200; // Minimum width of the target element
            let offset; // Get the target element's left offset
            const pointerPosition = e.touches[0].clientX;
            let newWidth;
            if (temptarget == '#innerLeft') {
                offset = $(temptarget).offset().left;
                newWidth = Math.min(500, Math.max(minWidth, pointerPosition - offset));
            } else if (temptarget == '#innerRight') {
                offset = document.getElementById(temptarget.replace('#', '')).getBoundingClientRect().right;
                newWidth = Math.min(500, Math.max(minWidth, offset - pointerPosition) - 20);
            }

            if (target.split('|').length == 1) {
                $(temptarget).css('width', newWidth + 'px');
            } else {
                let bodyStyles = window.getComputedStyle(document.body);
                let innermargin = bodyStyles.getPropertyValue('--inner-margin');
                $(target.split('|')[0]).css('width', newWidth + 'px');
                $(target.split('|')[1]).css('width', newWidth - innermargin.replace('px', '') * 2 + 'px');
            }
        }
    });

    $(document).on('touchend', function () {
        isHandlerDragging = false;
        target = null; // Clear the target when mouse is released
    });

    $(document).on('touchcancel', function () {
        isHandlerDragging = false;
        target = null; // Clear the target when mouse is released
    });

    $(document).on('input', '#labelsPerRow', function () {
        let value = $(this).val();
        userLabelConfig.labelsPerRow = value;
    });
});

//konva
$(document).ready(function () {
    container = document.querySelector('#innerEditor');
    width = container.offsetWidth;
    height = container.offsetHeight;
    console.log(width, height);

    let stage = new Konva.Stage({
        container: '#innerEditorCanvas',
        width: width,
        height: height,
        draggable: true,
    });

    backgroundLayer = new Konva.Layer();
    imageLayer = new Konva.Layer();
    textLayer = new Konva.Layer();
    layer1 = new Konva.Layer();
    layer2 = new Konva.Layer();
    stage.add(backgroundLayer);
    stage.add(imageLayer);
    stage.add(textLayer);
    stage.add(layer1);
    stage.add(layer2);

    stage.on('wheel', (e) => {
        // stop default scrolling
        e.evt.preventDefault();

        let oldScale = stage.scaleX();
        let pointer = stage.getPointerPosition();

        let mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        // how to scale? Zoom in? Or zoom out?
        let direction = e.evt.deltaY > 0 ? -1 : 1;

        // when we zoom on trackpad, e.evt.ctrlKey is true
        // in that case lets revert direction
        if (e.evt.ctrlKey) {
            direction = -direction;
        }

        let newScale = direction > 0 ? oldScale * userLabelConfig.zoomSensitivity : oldScale / scaleBy;

        stage.scale({ x: newScale, y: newScale });

        let newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };
        stage.position(newPos);
    });
});
