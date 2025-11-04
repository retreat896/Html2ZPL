import DefaultLabel from "./classes/DefaultLabel";
$(document).ready(async function () {
    //############################
    //#                          #
    //#          DEBUG           #
    //#                          #
    //############################

    //on load testing
    //create 1 label by default
    for (let i = 0; i < 1; i++) {
        let label = new DefaultLabel(labelLayer, userLabelConfig);
        label.render();
    }

    //create item draggable
    // let draggableTestConfig = { type: 'graphic', subtype: 'box' };
    // let testItem = new DragableItem(draggableTestConfig);
    // $('#itemContainer').append(testItem.getDraggableDOM());
});
