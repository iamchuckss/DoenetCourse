import React from 'react';
import Browser from "../imports/Browser";

export default function temp(){
  return <>
  <h1>reg</h1>
  <Browser />
  <h1>foldersOnly</h1>
  <Browser foldersOnly={true}/>
  <h1>selectOnlyOne</h1>
  <Browser selectOnlyOne={true} />
  <h1>Both</h1>
  <Browser foldersOnly={true} selectOnlyOne={true} />
  
  </>
}
