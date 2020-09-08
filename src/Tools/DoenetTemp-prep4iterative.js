import React, { useState, useMemo, useCallback } from 'react';


//Simple folder contents
export default function temp() {
  const [count,setCount] = useState(0);
  const [label2,setLabel2] = useState("my folder2");
  const [labels,setLabels] = useState(["my folder1","my folder2"]);

  console.log("\n###BASE label2",label2)
  const increment = useCallback(() => setCount(c => c + 1), [])
  
  // const contentObj1 = useMemo(()=>{return {label:"my folder", open:true}},[])
  // const contentObj2 = useMemo(()=>{return {label:label2, open:true}},[label2])
  const contentObj1 = useMemo(()=>{return {label:labels[0], open:true}},[labels[0]])
  const contentObj2 = useMemo(()=>{return {label:labels[1], open:true}},[labels[1]])

  return <>
  {/* <button onClick={()=>setCount(count+1)}>{count}</button> */}
  <button onClick={increment}>{count}</button>

  {/* <button onClick={()=>setLabel2("Changed")}>Change Label</button> */}
  <button onClick={()=>{
    let newLabels = [...labels];
    newLabels[0] = "my new value";
    setLabels(newLabels)
    }}>Change Label1</button>
     <button onClick={()=>{
    let newLabels = [...labels];
    newLabels[1] = "my new value";
    setLabels(newLabels)
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

