let container;
let width;
let height;
let backgroundLayer;
let labelLayer;
let objectLayer;
let extraLayer1;
let extraLayer2;

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
    labelPadding: 10,
    labelBorderWidth: 1,
    labelBorderColor: '#000000',
    labelBorderStyle: 'solid',
    labelBorderRadius: 0,
    labelBackgroundColor: '#ffffff',
    editorBackgroundColor: '#ffffff',
    zoomSensitivity: 1.1,
    maxZoom: 1.5, // default max zoom level
};
let LabelCount = 0;

//functions
function createLabel(positionalData) {
    LabelCount++;
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
        console.log("[main.js - createLabel()] : Label Double Clicked");

        // Create a new group to represent the inner canvas
        let innerCanvasGroup = new Konva.Group({
            x: label.x(),
            y: label.y(),
            id: 'innerCanvasGroup-' + LabelCount,
        });

        // Create a rectangle to serve as the background of the inner canvas
        let innerCanvasBackground = new Konva.Rect({
            width: userLabelConfig.width,
            height: userLabelConfig.height,
            fill: userLabelConfig.labelBackgroundColor,
            stroke: 'black',
            strokeWidth: 1,
            cornerRadius: 4,
        });

        // Add the background to the group
        innerCanvasGroup.add(innerCanvasBackground);

        // Add the group to an existing layer (e.g., layer2)
        labelLayer.add(innerCanvasGroup);

        console.log("[main.js - createLabel()] : Inner canvas group created");
    });



    return label;
}


function addLabel() {
    let x, y;
    let labelsPerRow = userLabelConfig.labelsPerRow ?? 5;
    let padding = userLabelConfig.labelPadding ?? 10;
    let labelWidth = userLabelConfig.width;
    let labelHeight = userLabelConfig.height;

    let columnIndex = LabelCount % labelsPerRow;
    let rowIndex = Math.floor(LabelCount / labelsPerRow);

    x = columnIndex * (labelWidth + padding);
    y = rowIndex * (labelHeight + padding);

    let label = createLabel({ x: x, y: y });

    labelLayer.add(label);
    labelLayer.draw(); // <-- Force redraw to update positions
}


function removeLabel(config) {
    let label = Konva.findOne('#' + config.id);
    if (label) {
        label.destroy();
    }
}

function reOrderLabels() {
    let labelsPerRow = userLabelConfig.labelsPerRow ?? 5;
    let padding = userLabelConfig.labelPadding ?? 10;
    let labelWidth = userLabelConfig.width;
    let labelHeight = userLabelConfig.height;

    if (!labelLayer) {
        console.error("LabelLayer not found!");
        return;
    }

    let labels = labelLayer.find('Rect'); // Get all label rects
    console.log(labels.length + " labels found.");

    labels.forEach((label, index) => {
        console.log("Reordering label " + index);
        let columnIndex = index % labelsPerRow;
        let rowIndex = Math.floor(index / labelsPerRow);

        let newX = columnIndex * (labelWidth + padding);
        let newY = rowIndex * (labelHeight + padding);

        label.to({
            x: newX,
            y: newY,
            duration: 0.3, // Smooth animation
            easing: Konva.Easings.EaseInOut,
        });
    });

    labelLayer.draw(); // Redraw layer
}

function changeBackgroundColor(color) {
    stage.container().style.backgroundColor = color;
}


//reset label settings to user defaults
$(function () {
    $('#labelSize').val(userLabelConfig.labelSize);

    // Custom Label Size
    $('#labelWidth').val(Math.floor(userLabelConfig.width/100));
    $('#labelHeight').val(Math.floor(userLabelConfig.height/100));

    // Label Padding
    $('#labelPadding').val(userLabelConfig.labelPadding);
    $('#labelPaddingValue').val(userLabelConfig.labelPadding);

    // Label Border Settings
    $('#labelBorderWidth').val(userLabelConfig.labelBorderWidth);
    $('#labelBorderWidthValue').val(userLabelConfig.labelBorderWidth);
    $('#labelBorderColor').val(userLabelConfig.labelBorderColor);
    $('#labelBackgroundColor').val(userLabelConfig.labelBackgroundColor);
    $('#labelBorderStyle').val(userLabelConfig.labelBorderStyle);
    $('#labelBorderRadius').val(userLabelConfig.labelBorderRadius);

    // Labels per row
    $('#labelsPerRow').val(userLabelConfig.labelsPerRow);
    $('#labelsPerRowValue').val(userLabelConfig.labelsPerRow);

    // Editor Settings
    $('#editorBackgroundColor').val(userLabelConfig.editorBackgroundColor);
    $('#editorZoomSensitivity').val(userLabelConfig.zoomSensitivity);
    $('#editorZoomSensitivityValue').val(userLabelConfig.zoomSensitivity);
    $('#editorMaxZoom').val(userLabelConfig.maxZoom);
    $('#editorMaxZoomValue').val(userLabelConfig.maxZoom);

    let target = null;
    let isHandlerDragging = false;

    $(document).on('mousedown touchstart', '.resize-bar-v', function (e) {
        isHandlerDragging = true;
        target = $(this).attr('data-krus-target');
        e.preventDefault(); // Prevent default action
    });

    $(document).on('mousedown touchstart', '#innerEditorCanvas:not(.resize-bar-v)', function (e) {
        isCanvasDragging = true;
    });

    $(document).on('mousemove touchmove', function (e) {
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

    $(document).on('mouseup touchend touchcancel', function () {
        isHandlerDragging = false;
        isCanvasDragging = false;
        target = null; // Clear the target when mouse is released
    });

    $(document).on('input', '#labelsPerRow', function () {
        let value = $(this).val();
        userLabelConfig.labelsPerRow = value;
    });
});

function isCrosshairInLabel() {
    let crosshairPos = stage.getPointerPosition(); // Get current pointer position
    let labels = labelLayer.find('Rect'); // Find all labels in the labelLayer

    for (let i = 0; i < labels.length; i++) {
        let label = labels[i];
        let bbox = label.getClientRect(); // Get transformed bounding box

        // Check if the crosshair position is inside the label's bounding box
        if (
            crosshairPos.x >= bbox.x &&
            crosshairPos.x <= bbox.x + bbox.width &&
            crosshairPos.y >= bbox.y &&
            crosshairPos.y <= bbox.y + bbox.height
        ) {
            console.log(`Crosshair is inside label with ID: ${label.id()}`);
            return true;
        }
    }

    console.log('Crosshair is not inside any label');
    return false;
}

function getValidLabelPosition() {

}

//konva
$(function () {
    container = document.querySelector('#innerEditor');
    width = container.offsetWidth;
    height = container.offsetHeight;
    console.log(width, height);

    stage = new Konva.Stage({
        container: '#innerEditorCanvas',
        width: width,
        height: height,
        draggable: true,
    });

    backgroundLayer = new Konva.Layer({ id: 'backgroundLayer' });
    labelLayer = new Konva.Layer({ id: 'labelLayer' });
    objectLayer = new Konva.Layer({ id: 'objectLayer' });
    extraLayer1 = new Konva.Layer({ id: 'extraLayer1' });
    extraLayer2 = new Konva.Layer({ id: 'extraLayer2' });
    stage.add(backgroundLayer);
    stage.add(labelLayer);
    stage.add(objectLayer);
    stage.add(extraLayer1);
    stage.add(extraLayer2);






    $("#innerEditorCanvas").on("mouseover", function (e) {
        if (window.isAddingObject) {
            $(this).css("cursor", "crosshair");

            // Create a temporary "shadow" object
            let draggedObject = document.querySelector('.addItem');
            const pointerPos = stage.getPointerPosition(); // Pointer position on the stage
            const transform = stage.getAbsoluteTransform().copy().invert(); // Invert stage transformations

            // Convert pointer position to stage-local coordinates
            const stagePos = transform.point({
                x: pointerPos.x,
                y: pointerPos.y
            });

            const { x, y } = stagePos;

            // Create the shadow Konva object
            let shadow = new Konva.Rect({
                width: draggedObject.offsetWidth,
                height: draggedObject.offsetHeight,
                x: x,
                y: y,
                fill: 'rgba(0, 0, 0, 0.3)', // Semi-transparent shadow
                listening: false, // Disable events for the shadow object
            });

            objectLayer.add(shadow);
            objectLayer.draw(); // Redraw the layer to show the shadow

            // Listen for mousemove to make the object follow the cursor
            stage.on('mousemove', (evt) => {
                //if crosshair is within the label, show the preview.
                if(!isCrosshairInLabel()) return;
                const pointerPos = stage.getPointerPosition(); // Current pointer position
                const localPos = stage.getAbsoluteTransform().copy().invert().point({
                    x: pointerPos.x,
                    y: pointerPos.y,
                });

                shadow.position({
                    x: localPos.x,
                    y: localPos.y,
                });

                objectLayer.batchDraw(); // Efficiently redraw only updated parts
            });

            // On mouseleave or mouseup, finalize or remove the shadow
            $("#innerEditorCanvas").on("mouseleave mouseup", function () {
                stage.off('mousemove'); // Remove mousemove listener
                shadow.destroy(); // Remove the shadow object
                objectLayer.draw(); // Update the layer
            });
        }
    });




    // Add draggable objects using Interact.js
    interact('.addItem').draggable({
        
        listeners: {
            move(event) {
                window.isAddingObject = true;
                const target = event.target;
                const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                target.style.transform = `translate(${x}px, ${y}px)`;
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);
                //if move over canvas add a shadow on the canvas of the object

            },
            end(event) {
                window.isAddingObject = false;
                let target = event.target;
                const pointerPos = stage.getPointerPosition(); // Pointer position on the stage
                const transform = stage.getAbsoluteTransform().copy().invert(); // Invert stage transformations
                // Convert pointer position to stage-local coordinates
                const stagePos = transform.point({
                    x: pointerPos.x,
                    y: pointerPos.y
                });
                const { x, y } = stagePos;
                let prevValidPosition = getValidLabelPosition();
                if (isCrosshairInLabel()|| prevValidPosition) {
                    const config = {
                        x: x,
                        y: y,
                        width: 100,
                        height: 30,
                        fill: 'blue', // Or any other color or configuration
                    };
                    // Add the Konva item at the calculated position
                    addKonvaItem(config);
                    // Example: Add visual feedback to the item container
                    $("#itemContainer").prepend(
                        $("<img>")
                            .addClass("img-fluid rounded-top addItem")
                            .attr("id", "addTestItem")
                            .attr("src", "images/image.jpg")
                    );
                } else {
                    // return the item to its original position
                    $("#itemContainer").prepend(
                        $("<img>")
                            .addClass("img-fluid rounded-top addItem")
                            .attr("id", "addTestItem")
                            .attr("src", "images/image.jpg")
                    );
                }
                target.remove();
            },
        },
    });

    // Function to add items to the Konva layer
    function addKonvaItem(config) {
        const text = new Konva.Rect({
            x: config.x,
            y: config.y,
            fontSize: 18,
            fill: config.fill,
            width: config.width,
            height: config.height,
            draggable: true,
        });

        objectLayer.add(text);
        objectLayer.draw();
    }

    // Add test item button click handler
    $('#addTestItem').on('click', function () {
        addKonvaItem({ x: 50, y: 50, width: 100, height: 30, text: 'New Item' });
    });









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



$(document).on("input", "#labelPadding", function () {
    userLabelConfig.labelPadding = parseInt($(this).val(), 10);
    reOrderLabels();
})

$(document).on("input", "#labelsPerRow", function () {
    userLabelConfig.labelsPerRow = parseInt($(this).val(), 10);
    reOrderLabels();
})

$(document).on("input", "#labelSize", function () {
    if($(this).val() == 'custom'){
        $("#customLabelSize").removeClass("d-none");
        
    }else{
        $("#customLabelSize").addClass("d-none");
    }
})

$(document).on("input", "#labelWidth", function () {})
$(document).on("input", "#labelHeight", function () {})
$(document).on("input", "#labelBorderRadius", function () {})
$(document).on("input", "#editorBackgroundColor", function () {changeBackgroundColor($(this).val())})