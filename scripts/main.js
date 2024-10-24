var container;
      var width;
      var height;
      let labelMap;
      var backgroundLayer;
      var imageLayer;
      var textLayer;
      var layer1;
      var layer2;

      var stage;
      //Globals
      var scaleBy = 1.1;
      var userLabelConfig = {
        x: 0,
        y: 0,
        width: 400,
        height: 600,
        fill: "lightgrey",
        stroke: "black",
        strokeWidth: 1,
        labelsPerRow: 5,
        padding: 10,
      };
      var LabelCount = 0;

      //functions
      function createLabel(config, useGlobalConfig) {
        if (useGlobalConfig) {
          config = { ...userLabelConfig, ...config };
          console.log(config);
        }
        LabelCount++;
        labelMap.set("Label" + LabelCount, config);
        return new Konva.Rect({
          x: config.x ?? width * Math.random(),
          y: config.y ?? height * Math.random(),
          width: config.width ?? 100,
          height: config.height ?? 100,
          fill: config.fill ?? "red",
          stroke: config.stroke ?? "black",
          draggable: false,
          id: "Label" + LabelCount,
          class: "Label",
        });
      }

      function addLabel() {
        let x, y;
        var labelsPerRow = userLabelConfig.labelsPerRow ?? 5;
        var padding = userLabelConfig.padding ?? 10;
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
        backgroundLayer.add(createLabel({ x: x, y: y }, true));
      }

      function removeLabel(config) {}

      //width sliders
      $(document).ready(function () {
        let target = null;
        let isHandlerDragging = false;

        $(document).on("mousedown", ".resize-bar-v", function (e) {
          isHandlerDragging = true;
          target = $(this).attr("data-krus-target");
          e.preventDefault(); // Prevent default action
        });

        $(document).on("mousemove", function (e) {
          if (!isHandlerDragging) {
            return;
          }

          if (target) {
            let temptarget = target;
            console.log(target);
            if (target.split("|").length != 1) {
              temptarget = target.split("|")[0];
            }
            const minWidth = 200; // Minimum width of the target element
            let offset; // Get the target element's left offset
            const pointerPosition = e.clientX;
            let newWidth;
            if (temptarget == "#innerLeft") {
              offset = $(temptarget).offset().left;
              newWidth = Math.min(
                500,
                Math.max(minWidth, pointerPosition - offset)
              );
            } else if (temptarget == "#innerRight") {
              offset = document
                .getElementById(temptarget.replace("#", ""))
                .getBoundingClientRect().right;
              newWidth = Math.min(
                500,
                Math.max(minWidth, offset - pointerPosition) - 20
              );
            } else {
              offset = $(temptarget).offset().left;
              newWidth = Math.min(
                500,
                Math.max(minWidth, pointerPosition - offset)
              );
            }
            // Get the current pointer position

            // Resize the target element based on the pointer position
            if (target.split("|").length == 1) {
              $(temptarget).css("width", newWidth + "px");
            } else {
              var bodyStyles = window.getComputedStyle(document.body);
              var innermargin = bodyStyles.getPropertyValue("--inner-margin");
              $(target.split("|")[0]).css("width", newWidth + "px");
              $(target.split("|")[1]).css(
                "width",
                newWidth - innermargin.replace("px", "") * 2 + "px"
              );
              console.log(
                "width",
                newWidth - innermargin.replace("px", "") * 2 + "px"
              );
            }
          }
        });

        $(document).on("mouseup", function () {
          isHandlerDragging = false;
          target = null; // Clear the target when mouse is released
        });

        $(document).on("touchstart", ".resize-bar-v", function (e) {
          isHandlerDragging = true;
          target = $(this).attr("data-krus-target");
          e.preventDefault(); // Prevent default action
        });

        $(document).on("touchmove", function (e) {
          if (!isHandlerDragging) {
            return;
          }

          if (target) {
            let temptarget = target;
            if (target.split("|").length != 1) {
              temptarget = target.split("|")[0];
            }
            const minWidth = 200; // Minimum width of the target element
            let offset; // Get the target element's left offset
            const pointerPosition = e.touches[0].clientX;
            let newWidth;
            if (temptarget == "#innerLeft") {
              offset = $(temptarget).offset().left;
              newWidth = Math.min(
                500,
                Math.max(minWidth, pointerPosition - offset)
              );
            } else if (temptarget == "#innerRight") {
              offset = document
                .getElementById(temptarget.replace("#", ""))
                .getBoundingClientRect().right;
              newWidth = Math.min(
                500,
                Math.max(minWidth, offset - pointerPosition) - 20
              );
            } else {
              offset = $(temptarget).offset().left;
              newWidth = Math.min(
                500,
                Math.max(minWidth, pointerPosition - offset)
              );
            }

            if (target.split("|").length == 1) {
              $(temptarget).css("width", newWidth + "px");
            } else {
              var bodyStyles = window.getComputedStyle(document.body);
              var innermargin = bodyStyles.getPropertyValue("--inner-margin");
              $(target.split("|")[0]).css("width", newWidth + "px");
              $(target.split("|")[1]).css(
                "width",
                newWidth - innermargin.replace("px", "") * 2 + "px"
              );
            }
          }
        });

        $(document).on("touchend", function () {
          isHandlerDragging = false;
          target = null; // Clear the target when mouse is released
        });

        $(document).on("touchcancel", function () {
          isHandlerDragging = false;
          target = null; // Clear the target when mouse is released
        });

        $(document).on("input", "#labelsPerRow", function () {
          var value = $(this).val();
          userLabelConfig.labelsPerRow = value;
        });
      });

      //konva
      $(document).ready(function () {
        container = document.querySelector("#innerEditor");
        width = container.offsetWidth;
        height = container.offsetHeight;
        labelMap = new Map();
        console.log(width, height);

        var stage = new Konva.Stage({
          container: "#innerEditorCanvas",
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

        var textNode = new Konva.Text({
          text: "Some text here",
          x: 800,
          y: 800,
          fontSize: 20,
          draggable: true,
          width: 200,
        });

        stage.on("wheel", (e) => {
          // stop default scrolling
          e.evt.preventDefault();

          var oldScale = stage.scaleX();
          var pointer = stage.getPointerPosition();

          var mousePointTo = {
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

          var newScale =
            direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

          stage.scale({ x: newScale, y: newScale });

          var newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
          };
          stage.position(newPos);
        });

        // backgroundLayer.add(createLabel({x:"10", y:"20", width:"400", height:"600", color:"grey"}));
        // backgroundLayer.add(createLabel({x:10+400+10, y:"20", width:"400", height:"600", color:"grey"}));
        // backgroundLayer.add(createLabel({x:"10", y:20+600+10, width:"400", height:"600", color:"grey"}));
        // backgroundLayer.add(createLabel({x:10+400+10, y:20+600+10, width:"400", height:"600", color:"grey"}));

        layer1.add(textNode);
        var tr = new Konva.Transformer({
          node: textNode,
          enabledAnchors: ["middle-left", "middle-right"],
          // set minimum width of text
          boundBoxFunc: function (oldBox, newBox) {
            newBox.width = Math.max(30, newBox.width);
            return newBox;
          },
        });

        textNode.on("transform", function () {
          // reset scale, so only with is changing by transformer
          textNode.setAttrs({
            width: textNode.width() * textNode.scaleX(),
            scaleX: 1,
          });
        });

        layer1.add(tr);

        textNode.on("dblclick dbltap", () => {
          // hide text node and transformer:
          textNode.hide();
          tr.hide();

          // create textarea over canvas with absolute position
          // first we need to find position for textarea
          // how to find it?

          // at first lets find position of text node relative to the stage:
          var textPosition = textNode.absolutePosition();

          // so position of textarea will be the sum of positions above:
          var areaPosition = {
            x: stage.container().offsetLeft + textPosition.x,
            y: stage.container().offsetTop + textPosition.y,
          };

          // create textarea and style it
          var textarea = document.createElement("textarea");
          document.body.appendChild(textarea);

          // apply many styles to match text on canvas as close as possible
          // remember that text rendering on canvas and on the textarea can be different
          // and sometimes it is hard to make it 100% the same. But we will try...
          textarea.value = textNode.text();
          textarea.style.position = "absolute";
          textarea.style.top = areaPosition.y + "px";
          textarea.style.left = areaPosition.x + "px";
          textarea.style.width =
            textNode.width() - textNode.padding() * 2 + "px";
          textarea.style.height =
            textNode.height() - textNode.padding() * 2 + 5 + "px";
          textarea.style.fontSize = textNode.fontSize() + "px";
          textarea.style.border = "none";
          textarea.style.padding = "0px";
          textarea.style.margin = "0px";
          textarea.style.overflow = "hidden";
          textarea.style.background = "none";
          textarea.style.outline = "none";
          textarea.style.resize = "none";
          textarea.style.lineHeight = textNode.lineHeight();
          textarea.style.fontFamily = textNode.fontFamily();
          textarea.style.transformOrigin = "left top";
          textarea.style.textAlign = textNode.align();
          textarea.style.color = textNode.fill();
          rotation = textNode.rotation();
          var transform = "";
          if (rotation) {
            transform += "rotateZ(" + rotation + "deg)";
          }

          var px = 0;
          // also we need to slightly move textarea on firefox
          // because it jumps a bit
          var isFirefox =
            navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
          if (isFirefox) {
            px += 2 + Math.round(textNode.fontSize() / 20);
          }
          transform += "translateY(-" + px + "px)";

          textarea.style.transform = transform;

          // reset height
          textarea.style.height = "auto";
          // after browsers resized it we can set actual value
          textarea.style.height = textarea.scrollHeight + 3 + "px";

          textarea.focus();

          function removeTextarea() {
            textarea.parentNode.removeChild(textarea);
            window.removeEventListener("click", handleOutsideClick);
            textNode.show();
            tr.show();
            tr.forceUpdate();
          }

          function setTextareaWidth(newWidth) {
            if (!newWidth) {
              // set width for placeholder
              newWidth = textNode.placeholder.length * textNode.fontSize();
            }
            // some extra fixes on different browsers
            var isSafari = /^((?!chrome|android).)*safari/i.test(
              navigator.userAgent
            );
            var isFirefox =
              navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
            if (isSafari || isFirefox) {
              newWidth = Math.ceil(newWidth);
            }

            var isEdge =
              document.documentMode || /Edge/.test(navigator.userAgent);
            if (isEdge) {
              newWidth += 1;
            }
            textarea.style.width = newWidth + "px";
          }

          textarea.addEventListener("keydown", function (e) {
            // hide on enter
            // but don't hide on shift + enter
            if (e.keyCode === 13 && !e.shiftKey) {
              textNode.text(textarea.value);
              removeTextarea();
            }
            // on esc do not set value back to node
            if (e.keyCode === 27) {
              removeTextarea();
            }
          });

          textarea.addEventListener("keydown", function (e) {
            scale = textNode.getAbsoluteScale().x;
            setTextareaWidth(textNode.width() * scale);
            textarea.style.height = "auto";
            textarea.style.height =
              textarea.scrollHeight + textNode.fontSize() + "px";
          });

          function handleOutsideClick(e) {
            if (e.target !== textarea) {
              textNode.text(textarea.value);
              removeTextarea();
            }
          }
          setTimeout(() => {
            window.addEventListener("click", handleOutsideClick);
          });
        });
      });