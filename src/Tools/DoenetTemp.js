import React, { useState, useMemo, useCallback } from 'react';


//Simple folder contents
export default function temp() {
  const [count,setCount] = useState(0);
  const [label2,setLabel2] = useState("my folder2");
  const [labels,setLabels] = useState(["my folder1","my folder2"]);
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
  const rootFolders = ['rf1','rf2']

  console.log("\n###BASE contentObj rf1 ",contentObj['rf1'])
  const increment = useCallback(() => setCount(c => c + 1), [])
  
  // const contentObj1 = useMemo(()=>{return {label:"my folder", open:true}},[])
  // const contentObj2 = useMemo(()=>{return {label:label2, open:true}},[label2])
  const contentObj1 = useMemo(()=>{return {label:contentObj['rf1'].label, open:true}},[contentObj['rf1'].label])
  const contentObj2 = useMemo(()=>{return {label:labels[1], open:true}},[labels[1]])

  return <>
  {/* <button onClick={()=>setCount(count+1)}>{count}</button> */}
  <button onClick={increment}>{count}</button>

  {/* <button onClick={()=>setLabel2("Changed")}>Change Label</button> */}
  <button onClick={()=>{
    setContentObj({...contentObj,"rf1":{"label":"my new label"}});
    }}>Change Label1</button>
      <button onClick={()=>{
    setContentObj({...contentObj,"rf2":{"label":"my new label2"}});
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

