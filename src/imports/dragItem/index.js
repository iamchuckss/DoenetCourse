import React, { useRef, useMemo } from "react";
import useDrag from "./useDrag";
import View from "./view";

const WithDragItem = ({ children, dragEffect, id, onDragStart, onDragOver, onDragEnd }) => {
  const dragRef = useRef();
  const { dragState } = useDrag({
    id,
    effect: dragEffect,
    ref: dragRef,
    onDragStart: (ev) => {
      onDragStart && onDragStart(ev, id);
      // let dragImage = document.createElement("img");
      // dragImage.style.visibility = "hidden";
      // event.dataTransfer.setDragImage(dragImage, 0, 0);
    },
    onDragOver: (ev) => onDragOver && onDragOver(ev, id),
    onDragEnd: () => onDragEnd && onDragEnd()
  });

  const styles = useMemo(() => ({
    cursor: dragState == "dragging" ? '-webkit-grabbing' : '-webkit-grab',
    zIndex: dragState == "dragging" ? 2 : 1,
    transition: "transform 1s"
  }), [dragState]);

  return (
    <View ref={dragRef} styles={styles}>
      {children}
    </View>
  );
};

export default WithDragItem;