class DefaultDragable {
    enableDragging(item) {
        
        interact().draggable({
            listeners: {
                start(event) {
                   
                },
                move(event) {
                   
                },
                end(event) {
                   
                },
            },
        });
    }
}
export const {enableDragging} = new DefaultDragable();