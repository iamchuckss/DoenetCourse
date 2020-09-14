import React, { useState, useMemo, useCallback, useReducer } from 'react';

//Simple folder contents
export default function temp() {
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
  const [contentUpdates,setContentUpdates] = useState({})
  const [allContentUpdates,setAllContentUpdates] = useState({})

  function reducer(state, action) {
    switch (action.type){
      case 'BROWSING':
        return {something: "no info"};
      case 'SELECTING':
        return {selectedItems: "array here"};
      case 'DRAGING':
        return {something: "array here"};
      case 'DROP':
        return {something: "location info"};
      default:
        throw new Error("Didn't specify type in reducer");
    }
  }

  const [state, dispatch] = useReducer(reducer, {selectedItems:[],something:""},()=>{console.log('called init')});
  console.log("STATE",state)
  console.log("\n###BASE contentUpdates",contentUpdates)
  
  let nodes = [];
  const actions = useCallback(()=>{return {toggleFolder:toggleFolder}},[])

  // console.log("allContentUpdates",allContentUpdates)
  if (Object.keys(contentUpdates).length > 0 ){
    setAllContentUpdates({...allContentUpdates,...contentUpdates})
    setContentUpdates({});
  }
  buildNodeArray(rootFolders);
  function buildNodeArray(folderArr,level=0,parent=""){
    for (let [i,id] of folderArr.entries()){
      const contentObjI = (allContentUpdates[id]) ? allContentUpdates[id] : contentObj[id];
      nodes.push(<Node key={`node${level}-${i}${parent}`} level={level} contentObj={contentObjI} nodeId={id} actions={actions}/>)
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
     let newContentUpdates = {...contentUpdates};
     newContentUpdates[folderId] = folderObj;
    setContentUpdates(newContentUpdates);
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
  const toggle = <button onClick={(e)=>{e.preventDefault(); e.stopPropagation(); props.actions().toggleFolder(props.nodeId,props.contentObj)}}>{toggleLabel}</button>
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

