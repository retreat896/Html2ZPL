/**
 * TODO:
 * [ ] [Dynamic item creation](https://github.com/retreat896/Html2ZPL/issues/16)
 * [ ] [Multiple items](https://github.com/retreat896/Html2ZPL/issues/17)
 * [ ] [Implement item list rendering](https://github.com/retreat896/Html2ZPL/issues/18)
 * [ ] [Handle item selection and focus](https://github.com/retreat896/Html2ZPL/issues/19)
 * [ ] [Add and remove items](https://github.com/retreat896/Html2ZPL/issues/20)
 * [ ] [Implement item addition](https://github.com/retreat896/Html2ZPL/issues/21)
 * [ ] [Implement item removal](https://github.com/retreat896/Html2ZPL/issues/22)
 * [ ] [Handle item deletion confirmation](https://github.com/retreat896/Html2ZPL/issues/23)
 */

 function isCrosshairInLabel() {
    let crosshairPos = stage.getPointerPosition(); // Get current pointer position
    let labels = labelLayer.find('Rect'); // Find all labels in the labelLayer

    for (let i = 0; i < labels.length; i++) {
        let label = labels[i];
        let bbox = label.getClientRect(); // Get transformed bounding box

        // Check if the crosshair position is inside the label's bounding box
        if (crosshairPos.x >= bbox.x && crosshairPos.x <= bbox.x + bbox.width && crosshairPos.y >= bbox.y && crosshairPos.y <= bbox.y + bbox.height) {
            return true;
        }
    }
    return false;
}

 function getLabelUnderPointer(pointerPos) {
    let labels = labelLayer.find('Rect'); // Get all labels
    return (
        labels.find((label) => {
            let box = label.getClientRect();
            return pointerPos.x >= box.x && pointerPos.x <= box.x + box.width && pointerPos.y >= box.y && pointerPos.y <= box.y + box.height;
        }) || null
    );
}


