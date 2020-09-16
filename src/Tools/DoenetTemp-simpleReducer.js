import React, { useState, useMemo, useCallback, useReducer } from 'react';
import './util.css';

function reducer(state, action) {
  console.log("REDUCER type:", action.type, "transferPayload:", action.payload)

  switch (action.type) {
    
    case 'ADDNODES': {
      console.log("+++++++++++++++ADDNODES")
      return { ...state }
    }

    default:
      throw new Error(`Unhandled type in reducer ${action, type}`);
  }
}

//Simple folder contents
export default function browser() {
  console.log("#START OF BROWSER")

 

  

  const [state, dispatch] = useReducer(reducer, { mode: "READY"});

  return <>
    <button onClick={()=>{dispatch({ type: "ADDNODES" })}}>Add Node</button>
    <h1>SIMPLE TEST</h1>
  </>
}
