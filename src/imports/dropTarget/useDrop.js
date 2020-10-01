import { useState, useEffect } from "react";

const useDrop = ({ ref, onDrop, onDropLeave, onDropEnter }) => {
  const [dropState, updateDropState] = useState("droppable");

  const dropLeaveCb = ev => {
    ev.preventDefault();
    onDropLeave && onDropLeave();
    updateDropState("drop leave");
  };

  const dropCb = ev => {
    ev.preventDefault();
    onDrop && onDrop();
    updateDropState("dropped");
    ev.stopPropagation();
  };

  const dropEnterCb = ev => {
    console.log("HERE", ev.currentTarget.getBoundingClientRect());
    console.log("HERE", ev.clientX);
    // compare topLeft X of moved block  to dropTarget topLeftX (compute from layer)

    onDropEnter && onDropEnter();
    ev.preventDefault();
    ev.stopPropagation();
  };

  const onDragOver = (ev) => {
    ev.stopPropagation();
    ev.preventDefault();
  }
  
  useEffect(() => {
    const elem = ref.current;
    if (elem) {
      elem.addEventListener("dragenter", dropEnterCb);
      // elem.addEventListener("dragleave", dropLeaveCb);
      elem.addEventListener("drop", dropCb);
      elem.addEventListener("dragover", onDragOver);
      return () => {
        elem.removeEventListener("dragenter", dropEnterCb);
        // elem.removeEventListener("dragLeave", dropLeaveCb);
        elem.removeEventListener("drop", dropCb);
        elem.removeEventListener("dragover", onDragOver);
      };
    }
  }, [dropLeaveCb, dropEnterCb, dropCb]);
  return {
    dropState
  };
};

export default useDrop;
