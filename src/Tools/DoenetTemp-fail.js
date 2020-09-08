import React, { useState, useMemo, useCallback } from 'react';
// import VerticalDivider from "../Doenet/components/VerticalDivider.js";
// import ToolLayout from '../Tools/ToolLayout/ToolLayout.js';
// import ToolLayoutPanel from '../Tools/ToolLayout/ToolLayoutPanel.js';
// import { getCourses_CI, setSelected_CI, saveCourse_CI } from "../imports/courseInfo";
// import DoenetBox from './DoenetBox';
// import styled from 'styled-components';
// import {
//   HashRouter as Router,
//   // BrowserRouter as Router,
//   Switch,
//   Route,
//   Link,
//   // useParams
// } from "react-router-dom";

export default function temp() {

  let [treea,setTreeA] = useState(["one","two","three"])
  let [treeb,setTreeb] = useState(["four","five"])

  const addMore = ()=> setTreeA([...treea,"more"])
 console.log("treea",treea)
return (
  <>
  <button onClick={addMore}>Add to A</button>
  <TreeNode key="a" name="A" content={treea}/>
  <TreeNode key="b" name="B" content={treeb}/>
  </>
);
}

function TreeNode(props){

  console.log('TreeNode props',props)


  function buildFiles(content){
    let files = []
    for (let [i,node] of content.entries()){
      files.push(<p key={`tree${i}`}>{node}</p>)
    }
    return files;
  }
  // const files = useMemo(() => buildFiles(props.content),[]);
  const files = buildFiles(props.content);

 

  return <>
  <h1>{props.name}</h1>
  {files}
  </>
}


