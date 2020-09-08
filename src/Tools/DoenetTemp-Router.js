import React, { useState } from 'react';
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


 
return (
  <>
  <Router>
    <div>
  <p><Link to="/one?hi=there">One</Link></p>
  <p><Link to="/two">Two</Link></p>
  <p><Link to="/three">Three</Link></p>

  <Switch>
    <Route path={["/one","/two"]} render={(props)=><OneTwo {...props} />}></Route>
    <Route path="/three" render={(props)=><Three {...props} />}></Route>
    {/* <Route path="/:id" component={Child} props={{test:"true"}}></Route> */}
    {/* <Route path="/:id" children={<Child />}></Route> */}
    {/* <Route path="/:id" ><Child /></Route> */}
  </Switch>
  {/* <Switch>
    <Route path="/one">
    <p>This is one <Count key='one' count={count} setCount={setCount} /> </p>
    </Route>

    <Route path="/two">
    <p>This is two <Count key='two' count={count} setCount={setCount} /></p>
    </Route>
  </Switch> */}

  {/* <Switch>
    <Route path="/three">
    <p>This is three (No count) </p>
    </Route>
  </Switch> */}

  </div>
  </Router>

  </>
);
}

function OneTwo(props) {
  console.log("props",props)
  return ( <div> <h3>One or two </h3> </div> );
}
function Three(props) {
  console.log("props",props)
  return ( <div> <h3>Three </h3> </div> );
}

function Count(props){
  return <>
  <p>Count {props.count}</p>
    {/* <button onClick={()=>props.setCount((prev)=>{props.setCount(prev+1)})}>+</button> */}
    <button onClick={()=>props.setCount((prev)=>prev+1)}>+</button>
    </>
}

// function Myswitch(props){
//   return <>
//   <Switch>
//     <Route path="/three">
//     <p>This is three (No count) </p>
//     </Route>
//   </Switch>
//   </>
// }



