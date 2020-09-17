import React, { useState, useMemo, useCallback, useReducer } from 'react';
import './util.css';

// function reducer(state,action){
//     console.log("call", state, action);
//   return state+action;
// }

//Simple folder contents
export default function Counter() {
  // First render will create the state, and it will
  // persist through future renders
  const [sum, dispatch] = useReducer((state, action) => {
    console.log("call", state, action);
    return state + action;
  }, 0);

  return (
    <>
      {sum}

      <button onClick={() => dispatch(1)}>Add 1</button>
    </>
  );
}
