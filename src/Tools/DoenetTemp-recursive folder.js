import React, { useState, useMemo, useCallback } from 'react';


export default function temp() {
  const [rootfolders, setRootfolders] = useState(['rf1','rf2'])
  const [contentObj, setContentObj] = useState(
    {'rf1':{
      label:"root folder",
      contentIds:['f1','f3']
    },
    'rf2':{
      label:"root folder 2",
      contentIds:['f4']
    },
    'f1':{
      label: "folder one",
      contentIds:['f2']
    },
    'f2':{
      label:"folder two",
      contentIds:[]
    },
    'f3':{
      label:"folder three",
      contentIds:[]
    },
    'f4': {
      label:"folder four",
      contentIds:[]
    }
  })

  function getContent(id){
    console.log('get ->',id)
    return contentObj[id];
  }
  if (!contentObj){
    console.log("contentObj",contentObj)
    return null;
  }
  console.log('###base',contentObj,contentObj['f2'])
  return (
    <>
    <button onClick={()=>{setContentObj((prev)=>{
      console.log("prev",prev)
      let newObj = {};
      Object.assign(newObj,prev)
      newObj['rf1'].label = 'changed!';
      setContentObj(newObj)
    })}}>Change stuff</button>
  <h1>Folders!</h1>

      <Folder level={0} contentObj={{contentIds:['rf1','rf2']}} getContent={getContent}/>
      {/* <Folder init={true} contentObj={{contentIds:['rf1','rf2']}} getContent={getContent}/> */}
    </>
  )
}

const Folder = function Folder(props) {
  // const Folder = React.memo(function Folder(props) {
  console.log('Folder props ->',props)
  // let contentObj = props.getContent
  const indentPx = 10;
  function buildSubTree(contentIds){
    console.log('build contents',contentIds)
    let subtree = [];
    for (let [i,contentId] of contentIds.entries()){
      let contentObj = props.getContent(contentId)
      console.log("contentObj",contentObj)

      subtree.push(<div key={`node${i}`} style={{marginLeft:`${props.level*indentPx}px`}} >{contentObj.label}</div>)
      //if open
      subtree.push(<Folder key={`key${i}`} level={props.level+1} contentObj={contentObj} getContent={props.getContent}/>)

 
    }
    return subtree;
  }
  let subTree = useMemo(()=>{return buildSubTree(props.contentObj.contentIds)},[props.contentObj.contentIds]);

  
  return <>
  {subTree}
  </>
}
// })


