import React, { useState, useMemo, useCallback } from 'react';


export default function temp() {
  const [count1, setCount1] = useState(0)
  const increment1 = useCallback(() => setCount1(c => c + 1), [])
  const [count2, setCount2] = useState(0)
  const increment2 = useCallback(() => setCount2(c => c + 1), [])

  const [myarray,setMyarray] = useState([1,3,5]);

  const files = useMemo(()=> myarray,[myarray]);
  const files2 = useMemo(()=> [1,2,3,4],[]);
  return (
    <>
      <button onClick={increment1}>Increment A</button>
      <button onClick={increment2}>Increment B</button>
      <button onClick={()=>setMyarray([...myarray,"more"])}>Change files</button>
      <CountButton name='a' count={count1}  files={files}/>
      <CountButton name='b' count={count2}  files={files2}/>
    </>
  )
}

const CountButton = React.memo(function CountButton(props) {
  console.log('NAME ->',props.name,props)

  function buildTree(myarr){
    console.log('build tree',myarr)
    let tree = [];
    for (let [i,file] of myarr.entries()){
      tree.push(<p key={`tree${i}`}>{file}</p>)
    }
    return tree;
  }
  let tree = useMemo(()=>{return buildTree(props.files)},[props.files]);
  // let tree = buildTree([1,2,3]);
  return <>
  <h1>{props.name}</h1>
  <p>Count = {props.count}</p>
  {tree}
  </>
})


