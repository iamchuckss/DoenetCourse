import React, { useRef } from "react";
import View from "./view";

import useDrop from "./useDrop";

const WithDropTarget = ({ children, heading, id, onDrop, onDropEnter, onDropExit, className }) => {
  const dropRef = useRef();
  const { dropState } = useDrop({
    ref: dropRef,
    onDropEnter: () => onDropEnter(id),
    onDrop: onDrop,
    // onDropLeave: () => { onDropleave && onDropLeave(id)},
    onDropExit: onDropExit
  });
  return (
    <View ref={dropRef} heading={heading} classes={className}>
      {children}
    </View>
  );
};


export default WithDropTarget;