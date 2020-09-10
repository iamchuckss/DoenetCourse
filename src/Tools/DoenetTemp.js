import React, { useState, useMemo, useCallback } from 'react';
import { RFC_2822 } from 'moment';


//Simple folder contents
export default function temp() {
  const [count,setCount] = useState(0);
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

  console.log("\n###BASE contentUpdates",contentUpdates)
  const increment = useCallback(() => setCount(c => c + 1), [])
  
  let nodes = [];
  const actions = useCallback(()=>{return {toggleFolder:toggleFolder}},[])

  buildNodeArray(rootFolders);
  function buildNodeArray(folderArr,level=0,parent=""){
    for (let [i,id] of folderArr.entries()){
      const contentObjI = (contentUpdates[id]) ? contentUpdates[id] : contentObj[id];
      nodes.push(<Node key={`node${level}-${i}${parent}`} level={level} contentObj={contentObjI} nodeId={id} actions={actions}/>)
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
    // console.log("----toggle folder----")
    // console.log("contentObj[folderId]",contentObj[folderId])
    // console.log("contentUpdates[folderId]",contentUpdates[folderId])
    // console.log("nodeContentObj",nodeContentObj)

    let folderObj = {...nodeContentObj};
     folderObj["open"] = !folderObj["open"];
     let newContentUpdates = {...contentUpdates};
     newContentUpdates[folderId] = folderObj;
    setContentUpdates(newContentUpdates);
  }
  
  return <>
  <button onClick={increment}>{count}</button>

  <button onClick={()=>{
    let rf1 = {...contentObj['rf1']};
    if (contentUpdates['rf1']){rf1 = {...contentUpdates['rf1']}; }
    rf1["label"] = `my new label (${count})`;
    setContentUpdates({...contentUpdates,rf1});
    }}>Change Label rf1</button>

      <button onClick={()=>{
    let f2 = {...contentObj['f2']};
    if (contentUpdates['f2']){f2 = {...contentUpdates['f2']}; }
    f2["label"] = `my new label (${count})`;
    setContentUpdates({...contentUpdates,f2});
    }}>Change Label f2</button>

    <button onClick={()=>{
    let rf2 = {...contentObj['rf2']};
    if (contentUpdates['rf2']){rf2 = {...contentUpdates['rf2']}; }
    rf2["contentIds"].push("f5");
    let f5 = {
      label:"folder five",
      contentIds:[],
      open:true,
    }
    setContentUpdates({...contentUpdates,rf2,f5});
    }}>Add f5 to rf2</button>

<button onClick={()=>{
    let rf1 = {...contentObj['rf1']};
    if (contentUpdates['rf1']){rf1 = {...contentUpdates['rf1']}; }
     rf1["contentIds"].splice(rf1["contentIds"].indexOf('f3'),1);
    setContentUpdates({...contentUpdates,rf1});
    }}>Remove f3 from rf1</button>

<button onClick={()=>{
  let folderId = 'rf2'
      let folderObj = {...contentObj[folderId]};
    if (contentUpdates[folderId]){folderObj = {...contentUpdates[folderId]}; }
    toggleFolder(folderId,folderObj);
    }}>Toggle Open/Close rf2</button>

  <h1>Folders</h1>
  {nodes}
  </>
}

const Node = React.memo(function Node(props){
  console.log("Node", props)
  const indentPx = 10;
  if (props.empty){return <div style={{marginLeft:`${props.level*indentPx}px`}} >EMPTY</div>}
  const toggleLabel = (props.contentObj.open)?"Close":"Open";
  const toggle = <button onClick={()=>props.actions().toggleFolder(props.nodeId,props.contentObj)}>{toggleLabel}</button>
  // const toggle = <button onClick={()=>props.actions.toggleFolder(props.nodeId)}>{toggleLabel}</button>
  return <div style={{marginLeft:`${props.level*indentPx}px`}} >{toggle}{props.contentObj.label}</div>
})

