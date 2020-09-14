import React, { useState, useMemo, useCallback, useReducer } from 'react';

//Simple folder contents
export default function temp() {
  console.log("#START OF TEMP")
  const [contentObj, setContentObj] = useState(
    {'rf1':{
      label:"root folder",
      contentIds:['f1','f3'],
      open:true,
    },
    'rf2':{
      label:"root folder 2",
      contentIds:['f4'],
      open:true,
    },
    'f1':{
      label: "folder one",
      contentIds:['f2'],
      open:true,
    },
    'f2':{
      label:"folder two",
      contentIds:[],
      open:false,
    },
    'f3':{
      label:"folder three",
      contentIds:[],
      open:false,
    },
    'f4': {
      label:"folder four",
      contentIds:[],
      open:false,
    }
  })
  const rootFolders = ['rf1','rf2']
  const [transferPayload,setTransferPayload] = useState({})
  const [allContentUpdates,setAllContentUpdates] = useState({})

  //Payload????
  //if(action.payload && action.payload.amt){amt = action.payload.amt}
  function reducer(state, action) {
    console.log("REDUCER type:",action.type,"transferPayload:",action.payload)

    switch (action.type){
      case 'TOGGLEFOLDER':
        //Do toggle work here using state instead of allContentUpdates

        return {...state,nodeUpdates:"updates here"};
      
      default:
        throw new Error(`Unhandled type in reducer ${action,type}`);
    }
  }

  const [state, dispatch] = useReducer(reducer, {allContentUpdates:{}});
  console.log("STATE",state)
  console.log("\n###BASE transferPayload",transferPayload)
  
  let nodes = [];
  const actions = useCallback(()=>{return {toggleFolder:toggleFolder}},[])

  // Dispatch Caller
  if (Object.keys(transferPayload).length > 0 ){
    // setAllContentUpdates({...allContentUpdates,...transferPayload})  //Delete
    dispatch({type: transferPayload.action,payload:transferPayload.payload})
    setTransferPayload({});
  }
  const transferDispatch =  useCallback((action,payload)=>{
    console.log("!!!!!!!! transferDispatch action:",action,"payload:",payload)
    setTransferPayload({action,payload})
  },[]);

  buildNodeArray(rootFolders);

  function buildNodeArray(folderArr,level=0,parent=""){
    for (let [i,id] of folderArr.entries()){
      const contentObjI = (allContentUpdates[id]) ? allContentUpdates[id] : contentObj[id];
      nodes.push(<Node key={`node${level}-${i}${parent}`} level={level} contentObj={contentObjI} nodeId={id} actions={actions} transferDispatch={transferDispatch}/>)
      // nodes.push(<Node key={`node${level}-${i}${parent}`} level={level} contentObj={contentObjI} nodeId={id} actions={actions} contentUpdates={contentUpdates} />)
      //If open then do this part
      if (contentObjI.open){
        buildNodeArray(contentObjI.contentIds,level+1,`${parent}-${i}`)
      }
    }
    if (folderArr.length === 0){
      nodes.push(<Node key={`node${level}-0${parent}`} level={level} empty={true} />)
    }
  }


  
  function toggleFolder(folderId,nodeContentObj){
    let folderObj = {...nodeContentObj};
     folderObj["open"] = !folderObj["open"];
     let newContentUpdates = {...transferPayload};
     newContentUpdates[folderId] = folderObj;
    setTransferPayload(newContentUpdates);
  }
  
  return <>
  <h1>Folders</h1>
  {nodes}
  </>
}

const Node = React.memo(function Node(props){
  console.log("Node", props)

  const indentPx = 20;
  if (props.empty){return <div style={{
    width: "300px",
    padding: "4px",
    border: "1px solid black",
    backgroundColor: "white",
    margin: "2px"
  }} ><div style={{textAlign: "center"}} >EMPTY</div></div>}
  const toggleLabel = (props.contentObj.open)?"Close":"Open";
  const toggle = <button onClick={(e)=>{
    e.preventDefault(); 
    e.stopPropagation(); 
    props.transferDispatch('TOGGLEFOLDER',{nodeId:props.nodeId,contentObj:props.contentObj})
    // props.actions().toggleFolder(props.nodeId,props.contentObj);
  }}>{toggleLabel}</button>
  let bgcolor = "#e2e2e2";
  if (props.contentObj.isSelected){bgcolor = "#6de5ff";}
  return <div onClick={()=>{console.log(`Clicked ${props.nodeId}`)}} style={{
    width: "300px",
    padding: "4px",
    border: "1px solid black",
    backgroundColor: bgcolor,
    margin: "2px"
  }} ><div style={{
    marginLeft:`${props.level*indentPx}px`
  }}>{toggle} [icon] {props.contentObj.label} ({props.contentObj.contentIds.length})</div></div>
})

