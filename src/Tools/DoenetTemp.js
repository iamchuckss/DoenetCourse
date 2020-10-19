import React, {useEffect, useState} from 'react';
import Browser from "../imports/Browser";
import {
  HashRouter as Router,
  Switch,
  Route,
  useHistory
} from "react-router-dom";
import nanoid from 'nanoid';


function BrowserRouted(props){
 return <Router><Switch>
          <Route path="/" render={(routeprops)=><Browser route={{...routeprops}} {...props} />}></Route>
        </Switch></Router>
}

function ExperimentRouted(props){
  return <Router><Switch>
           <Route path="/" render={(routeprops)=><Experiment route={{...routeprops}} {...props} />}></Route>
         </Switch></Router>
 }

//Use to figure out remote dispatch
function Experiment(props){
  const [browserId,setBrowserId] = useState("");
  const [loadedNodeObj, setLoadedNodeObj] = useState({});
  const history = useHistory();

  useEffect(()=>{
    const browserid = nanoid();
    setBrowserId(browserid);
    setLoadedNodeObj(props.loadedNodeObj);
    if (props.actionObj.action === "START"){
      console.log(">>> START!");
      if (props.route.location.pathname !== "/"){
          const [varA,varB] = props.route.location.pathname.split("/").filter(i=>i);
          setLoadedNodeObj({varA,varB})
      }
     
    }
  },[]);
  console.log(`=======START OF ${props.name}`,loadedNodeObj,props.route.location.pathname)
  useEffect(()=>{
    if (props.actionObj.action !== "START"){
      console.log(">>>actionObj",props.actionObj)
      if (props.actionObj.source !== browserId){
        if (props.actionObj.action === "addVarA"){
          let newA = Number(loadedNodeObj.varA) + 1;
          let newLoadedNodeObj = {...loadedNodeObj};
          newLoadedNodeObj.varA = newA;
          setLoadedNodeObj(newLoadedNodeObj);
        }
        if (props.actionObj.action === "addVarB"){
          let newB = Number(loadedNodeObj.varB) + 1;
          let newLoadedNodeObj = {...loadedNodeObj};
          newLoadedNodeObj.varB = newB;
          setLoadedNodeObj(newLoadedNodeObj);
        }
      }
    }
  },[props.actionObj])
  
  if (browserId === ""){
    return <div>Loading...</div>
  }

  
  return <>
  <h2>{props.name}</h2>
  <div>var A {loadedNodeObj.varA} <button onClick={()=>{
    let newA = Number(loadedNodeObj.varA) + 1;
      const path = "/"+newA+"/"+loadedNodeObj.varB+"/";
      history.push(path);
      let newLoadedNodeObj = {...loadedNodeObj};
      newLoadedNodeObj.varA = newA;
      setLoadedNodeObj(newLoadedNodeObj);

      props.externalDispatch({source:browserId,action:"addVarA",payload:{varA:newA}})
    }
  }>+</button></div>
  <div>var B {loadedNodeObj.varB} <button onClick={()=>{
    let newB = Number(loadedNodeObj.varB) + 1;
      const path = "/"+loadedNodeObj.varA+"/"+newB+"/";
      history.push(path);
      let newLoadedNodeObj = {...loadedNodeObj};
      newLoadedNodeObj.varB = newB;
      setLoadedNodeObj(newLoadedNodeObj);
      props.externalDispatch({source:browserId,action:"addVarB",payload:{varB:newB}})
    }
  }>+</button></div>
  </>
}


export default function temp(){

  const [contentNodeObj, setContentNodeObj] = useState(
    {varA:0,varB:0}
    )
  const [actionObj, setActionObj] = useState({action:"START"});

  function externalDispatch({source,action,payload}){
    console.log(">>>externalDispatch",source,action,payload);
    setActionObj({
      source,
      action,
      payload
    })
  }


  return <>
      <ExperimentRouted name="ExperimentRouted 1" loadedNodeObj={contentNodeObj} actionObj={actionObj} externalDispatch={externalDispatch} />
      <ExperimentRouted name="ExperimentRouted 2" loadedNodeObj={contentNodeObj} actionObj={actionObj} externalDispatch={externalDispatch} />
  
    {/* <div style={{display:"flex",justifyContent:"space-between"}}>
      <div>
      <h1>Nav</h1>
      <BrowserRouted foldersOnly={true} selectOnlyOne={true} alwaysSelected={true} externalDispatch={externalDispatch} />
      </div>
      <div>
      <h1>Main</h1>
      <BrowserRouted loadedNodeObj={contentNodeObj} externalDispatch={externalDispatch} />
      </div>
      <div>
      <h1>Support</h1>
      <BrowserRouted externalDispatch={externalDispatch} />
      </div>
      {/* <div>
      <h1>Regular Browser</h1> 
      <Browser />
      </div> */}
    {/* </div>  */}


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
