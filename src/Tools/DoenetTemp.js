import React from 'react';
import Browser from "../imports/Browser";
import {
  HashRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

function BrowserRouted(props){
 return <Router><Switch>
          <Route path="/" render={(routeprops)=><Browser route={{...routeprops}} {...props} />}></Route>
        </Switch></Router>
}


export default function temp(){
  return <>
  
    <div style={{display:"flex",justifyContent:"space-between"}}>
      <div>
      <h1>Nav</h1>
      <BrowserRouted foldersOnly={true} selectOnlyOne={true} alwaysSelected={true} />
      </div>
      <div>
      <h1>Main</h1>
      <BrowserRouted />
      </div>
      <div>
      <h1>Support</h1>
      <BrowserRouted />
      </div>
      {/* <div>
      <h1>Regular Browser</h1> 
      <Browser />
      </div> */}
    </div>


  {/* <h1>reg</h1>
  <Browser />
  <h1>foldersOnly</h1>
  <Browser foldersOnly={true}/>
  <h1>selectOnlyOne</h1>
  <Browser selectOnlyOne={true} />
  <h1>Both</h1>
  <Browser foldersOnly={true} selectOnlyOne={true} /> */}
  
  </>
}
