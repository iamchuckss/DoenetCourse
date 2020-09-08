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
      open:true,
    },
    'f3':{
      label:"folder three",
      contentIds:[],
      open:true,
    },
    'f4': {
      label:"folder four",
      contentIds:[],
      open:true,
    }
  })
  // const rootFolders = ['rf1','rf2']
  const [contentUpdates,setContentUpdates] = useState({})

  console.log("\n###BASE contentUpdates",contentUpdates)
  const increment = useCallback(() => setCount(c => c + 1), [])
  
  const contentObj1 = useMemo(()=>{return (contentUpdates['rf1']) ? contentUpdates['rf1'] : contentObj['rf1']},[contentUpdates['rf1']]);
  const contentObj2 = useMemo(()=>{return (contentUpdates['rf2']) ? contentUpdates['rf2'] : contentObj['rf2']},[contentUpdates['rf2']]);

  return <>
  {/* <button onClick={()=>setCount(count+1)}>{count}</button> */}
  <button onClick={increment}>{count}</button>

  {/* <button onClick={()=>setLabel2("Changed")}>Change Label</button> */}
  <button onClick={()=>{
    let rf1 = {...contentObj['rf1']};
    if (contentUpdates['rf1']){rf1 = {...contentUpdates['rf1']}; }
    rf1["label"] = `my new label (${count})`;
    setContentUpdates({...contentUpdates,rf1});
    }}>Change Label1</button>
      <button onClick={()=>{
    let rf2 = {...contentObj['rf2']};
    if (contentUpdates['rf2']){rf2 = {...contentUpdates['rf2']}; }
    rf2["label"] = `my new label (${count})`;
    setContentUpdates({...contentUpdates,rf2});
    }}>Change Label2</button>
  <h1>Folders</h1>
  <Node contentObj={contentObj1} />
  <Node contentObj={contentObj2} />
  </>
 
}

const Node = React.memo(function Node(props){
  console.log("Node", props)
  const indentPx = 10;
  const level = 1;
  return <div style={{marginLeft:`${level*indentPx}px`}} >{props.contentObj.label}</div>
})

