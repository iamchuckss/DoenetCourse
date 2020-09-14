import React, { useState, useMemo, useCallback, useReducer } from 'react';

//Simple folder contents
export default function temp() {


  function reducer(state, action) {
    switch (action.type){
      case 'INCREASE':
        let amt = 1;
        if(action.payload && action.payload.amt){amt = action.payload.amt}
        return {count: state.count + amt};
      case 'DECREASE':
        return {count: state.count - 1};
      case 'RESET':
        return {count: 0};
      default:
        throw new Error("Didn't specify type in reducer");
    }
  }

  const [state, dispatch] = useReducer(reducer, 0,(initcount)=>{return {count:initcount}});
  console.log("STATE",state)
  
  return <>
  <h1>Try reducer count: {state.count} </h1>
  <button onClick={()=>dispatch({type: 'INCREASE'})}>+</button>
  <button onClick={()=>dispatch({type: 'DECREASE'})}>-</button>
  <button onClick={()=>dispatch({type: 'RESET'})}>reset</button>
  <button onClick={()=>dispatch({type: 'INCREASE',payload:{amt:2}})}>++</button>
  </>
}
