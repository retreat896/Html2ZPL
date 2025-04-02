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
    zoomSensitivity: 2,
    maxZoom: 1.5,
    minZoom: 0.5,
};

function changeBackgroundColor(color) {
    stage.container().style.backgroundColor = color;
}

//reset label settings to user defaults
//on document ready
$(function () {
    

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
                //store to localstorage
                localStorage.setItem(`${temptarget.replace('#', '')}Width`, newWidth);
            } else {
                let bodyStyles = window.getComputedStyle(document.body);
                let innermargin = bodyStyles.getPropertyValue('--inner-margin');
                $(target.split('|')[0]).css('width', newWidth + 'px');
                $(target.split('|')[1]).css('width', newWidth - innermargin.replace('px', '') * 2 + 'px');
                localStorage.setItem(`${target.split('|')[0].replace('#', '')}Width`, newWidth);
                localStorage.setItem(`${target.split('|')[1].replace('#', '')}Width`, newWidth - innermargin.replace('px', '') * 2);
            }
        }
    });

    $(document).on('mouseup touchend touchcancel', function () {
        isHandlerDragging = false;
        isCanvasDragging = false;
        target = null; // Clear the target when mouse is released
    });
});

function isCrosshairInLabel() {
    let crosshairPos = stage.getPointerPosition(); // Get current pointer position
    let labels = labelLayer.find('Rect'); // Find all labels in the labelLayer

    for (let i = 0; i < labels.length; i++) {
        let label = labels[i];
        let bbox = label.getClientRect(); // Get transformed bounding box

        // Check if the crosshair position is inside the label's bounding box
        if (crosshairPos.x >= bbox.x && crosshairPos.x <= bbox.x + bbox.width && crosshairPos.y >= bbox.y && crosshairPos.y <= bbox.y + bbox.height) {
            console.log(`Crosshair is inside label with ID: ${label.id()}`);
            return true;
        }
    }

    console.log('Crosshair is not inside any label');
    return false;
}

function getValidLabelPosition() {}

function adjustZoom(e) {
    if (!e || !e.evt) {
        let currentZoom = stage.scaleX();
        let tempScale = currentZoom;

        if (currentZoom > userLabelConfig.maxZoom) {
            tempScale = userLabelConfig.maxZoom;
        } else if (currentZoom < userLabelConfig.minZoom) {
            tempScale = userLabelConfig.minZoom;
        }

        const stageBox = stage.getClientRect();
        const containerBox = container.getBoundingClientRect();

        const offsetX = (containerBox.width - stageBox.width * tempScale) / 2;
        const offsetY = (containerBox.height - stageBox.height * tempScale) / 2;

        stage.to({
            scaleX: tempScale,
            scaleY: tempScale,
            x: offsetX,
            y: offsetY,
            duration: 0.2,
            easing: Konva.Easings.EaseInOut,
        });

        return;
    }

    // Prevent default scrolling behavior
    e.evt.preventDefault();

    let oldScale = stage.scaleX();
    let pointer = stage.getPointerPosition();

    // Get pointer position relative to the stage
    let mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
    };

    // Determine zoom direction
    let direction = e.evt.deltaY > 0 ? -1 : 1;

    // Adjust zoom sensitivity for trackpads
    if (e.evt.ctrlKey) {
        direction = -direction;
    }

    // Calculate new scale
    let newScale = direction > 0 ? oldScale * userLabelConfig.zoomSensitivity : oldScale / userLabelConfig.zoomSensitivity;

    // Enforce min/max zoom
    newScale = Math.max(userLabelConfig.minZoom, Math.min(userLabelConfig.maxZoom, newScale));

    // Calculate new stage position
    let newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
    };

    // Apply the new scale and position
    stage.to({
        scaleX: newScale,
        scaleY: newScale,
        x: newPos.x,
        y: newPos.y,
        duration: 0.2,
    });
}

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

    $('#innerEditorCanvas').on('mouseover', function (e) {
        if (window.isAddingObject) {
            $(this).css('cursor', 'crosshair');

            // Create a temporary "shadow" object
            let draggedObject = document.querySelector('.addItem');
            const pointerPos = stage.getPointerPosition(); // Pointer position on the stage
            const transform = stage.getAbsoluteTransform().copy().invert(); // Invert stage transformations

            // Convert pointer position to stage-local coordinates
            const stagePos = transform.point({
                x: pointerPos.x,
                y: pointerPos.y,
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
                if (!isCrosshairInLabel()) return;
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
            $('#innerEditorCanvas').on('mouseleave mouseup', function () {
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
                    y: pointerPos.y,
                });
                const { x, y } = stagePos;
                let prevValidPosition = getValidLabelPosition();
                if (isCrosshairInLabel() || prevValidPosition) {
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
                    $('#itemContainer').prepend($('<img>').addClass('img-fluid rounded-top addItem').attr('id', 'addTestItem').attr('src', 'images/image.jpg'));
                } else {
                    // return the item to its original position
                    $('#itemContainer').prepend($('<img>').addClass('img-fluid rounded-top addItem').attr('id', 'addTestItem').attr('src', 'images/image.jpg'));
                }
                target.remove();
            },
        },
    });

    stage.on('wheel', adjustZoom);
});
$(document).on('input', '#labelPadding', function () {
    userLabelConfig.labelPadding = parseInt($(this).val(), 10);
    reOrderLabels();
});

$(document).on('input', '#labelsPerRow', function () {
    userLabelConfig.labelsPerRow = parseInt($(this).val(), 10);
    reOrderLabels();
});

$(document).on('input', '#labelSize', function () {
    if ($(this).val() == 'custom') {
        $('#customLabelSize').removeClass('d-none');
    } else {
        $('#customLabelSize').addClass('d-none');
    }
});

$(document).on('input', '#labelWidth', function () {});
$(document).on('input', '#labelHeight', function () {});
$(document).on('input', '#labelBorderRadius', function () {});
$(document).on('input', '#editorBackgroundColor', function () {
    changeBackgroundColor($(this).val());
});

$(document).on('input', '#editorZoomSensitivity', function () {
    userLabelConfig.zoomSensitivity = parseFloat($(this).val());
});

$(document).on('input', '#editorMaxZoom', function () {
    userLabelConfig.maxZoom = parseFloat($(this).val());
    adjustZoom();
});

$(document).on('input', '#editorMinZoom', function () {
    userLabelConfig.minZoom = parseFloat($(this).val());
    adjustZoom();
});

$(document).on('input', '#labelBorderWidth', function () {});
$(document).on('input', '#labelBorderColor', function () {});
$(document).on('input', '#labelBackgroundColor', function () {});
$(document).on('input', '#labelBorderStyle', function () {});
