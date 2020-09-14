import React, { useState, useMemo, useCallback, useReducer } from 'react';

//Simple folder contents
export default function temp() {



  //Need to spread state in return values or else you loose the other count
  function reducer(state, action) {
    switch (action.type){
      case 'INCREASEA':
        return {...state,counta: state.counta + 1};
      case 'DECREASEA':
        return {...state,counta: state.counta - 1};
      case 'RESETA':
        return {...state,counta: 0};
      case 'INCREASEB':
        return {...state,countb: state.countb + 1};
      case 'DECREASEB':
        return {...state,countb: state.countb - 1};
      case 'RESETB':
        return {...state,countb: 0};
        // return {countb: 0};
      default:
        throw new Error("Didn't specify type in reducer");
    }
  }

  const [state, dispatch] = useReducer(reducer, {counta:0, countb:0});
  // const [state, dispatch] = useReducer(reducer, 0,(initcount)=>{return {counta:initcount, countb:initcount}});
  console.log("STATE",state)
  
  return <>
  <h1>Count A: {state.counta} </h1>
  <button onClick={()=>dispatch({type: 'INCREASEA'})}>+</button>
  <button onClick={()=>dispatch({type: 'DECREASEA'})}>-</button>
  <button onClick={()=>dispatch({type: 'RESETA'})}>reset</button>
  <h1>Count B: {state.countb} </h1>
  <button onClick={()=>dispatch({type: 'INCREASEB'})}>+</button>
  <button onClick={()=>dispatch({type: 'DECREASEB'})}>-</button>
  <button onClick={()=>dispatch({type: 'RESETB'})}>reset</button>
  </>
}
