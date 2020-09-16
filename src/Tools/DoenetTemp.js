import React, { useState, useMemo, useCallback, useReducer } from 'react';
import './util.css';

//Simple folder contents
export default function browser() {
  console.log("#START OF BROWSER")
  const [loadedNodeObj, setLoadedNodeObj] = useState(
    {
      'root': {childNodeIds:['rf1', 'rf2']},
      'rf1': {
        label: "root folder",
        childNodeIds: ['f1', 'f3'],
        isOpen: true,
        appearance: "default",
      },
      'rf2': {
        label: "root folder 2",
        childNodeIds: ['f4'],
        isOpen: true,
        appearance: "default",
      },
      'f1': {
        label: "folder one",
        childNodeIds: ['f2'],
        isOpen: true,
        appearance: "default",
      },
      'f2': {
        label: "folder two",
        childNodeIds: [],
        isOpen: false,
        appearance: "default",
      },
      'f3': {
        label: "folder three",
        childNodeIds: [],
        isOpen: false,
        appearance: "default",
      },
      'f4': {
        label: "folder four",
        childNodeIds: [],
        isOpen: false,
        appearance: "default",
      }
    })
 
  const [transferPayload, setTransferPayload] = useState({})

  function reducer(state, action) {
    console.log("REDUCER type:", action.type, "transferPayload:", action.payload)

    switch (action.type) {
      case 'TOGGLEFOLDER': {
        let nodeObj = { ...action.payload.nodeObj }
        nodeObj["isOpen"] = !nodeObj["isOpen"];
        let allUpdates = { ...state.allUpdates };
        allUpdates[action.payload.nodeId] = nodeObj;
        let nodeIdsArr = [];
        return { ...state, allUpdates,nodeIdsArr };
      }
      case 'CLICKITEM': {
        const metakey = action.payload.metaKey;
        const shiftKey = action.payload.shiftKey;
        let mode = state.mode;
        mode = "SELECT";

        //Don't do anything if both shift and meta keys are pressed
        if (metakey && shiftKey) {
          return { ...state };
        }

        let nodeObj = { ...action.payload.nodeObj }
        let allUpdates = { ...state.allUpdates };

        let nodeIdsArr = state.nodeIdsArr;

        if (!metakey && !shiftKey) {
          //No shift or control so only select/deselect this node
          if (nodeObj["appearance"] === "selected"){
            nodeObj["appearance"] = "default";
          }else{
            nodeObj["appearance"] = "selected";
          }
          for (let nodeId of state.allSelected) {
            let deselectedNode = { ...allUpdates[nodeId] }
            deselectedNode.appearance = "default";
            allUpdates[nodeId] = deselectedNode
          }
          if (nodeObj["appearance"] === "selected"){
            state.allSelected = [action.payload.nodeId];
          }else{
            state.allSelected = [];
          }
        } else if (metakey && !shiftKey) {
          //Control so add just this one
          if (nodeObj["appearance"] === "selected"){
            nodeObj["appearance"] = "default";
            state.allSelected.splice(state.allSelected.indexOf(action.payload.nodeId),1)
          }else{
            state.allSelected.push(action.payload.nodeId)
            nodeObj["appearance"] = "selected";
          }
        
        } else if (!metakey && shiftKey) {
          //Shift so add whole range
          let lastNodeIdSelected = state.allSelected[state.allSelected.length - 1];
          if (lastNodeIdSelected !== undefined) {
          nodeObj["appearance"] = "selected";

            //Find range of nodes and turn selection on for those that are off
            //Build array of nodeids if length is 0
            //Only build node ids array if we need it
            if (nodeIdsArr.length === 0){
              const latestRootFolders = ((allUpdates['root']) ? allUpdates['root'] : loadedNodeObj['root']).childNodeIds;
              nodeIdsArr = buildNodeIdArray({folderArr:latestRootFolders,allUpdates:state.allUpdates});
            }
            let indexOfLastNodeId = nodeIdsArr.indexOf(lastNodeIdSelected);
            let indexOfCurrentNodeId = nodeIdsArr.indexOf(action.payload.nodeId);
            let rangeArr = nodeIdsArr.slice(Math.min(indexOfLastNodeId,indexOfCurrentNodeId), Math.max(indexOfLastNodeId,indexOfCurrentNodeId));
            for (let nodeId of rangeArr){
              let nodeObj = (allUpdates[nodeId]) ? allUpdates[nodeId] : loadedNodeObj[nodeId];
              if (nodeObj["appearance"] !== "selected"){
                let newNodeObj = { ...nodeObj }
                newNodeObj["appearance"] = "selected";
                state.allSelected.push(nodeId);
                allUpdates[nodeId] = newNodeObj;
              }
              
            }

          }
        }


        allUpdates[action.payload.nodeId] = nodeObj;
        if (state.allSelected.length === 0){ mode = "READY"}
        return { ...state, allUpdates,nodeIdsArr,mode };
      }
      case 'ADDNODES': {
        let newAllUpdates = {...state.allUpdates}
        const nodeReceiverId = action.payload.nodeReceiverId;
        let newNodeReceiver = {...(newAllUpdates[nodeReceiverId]) ? newAllUpdates[nodeReceiverId] : loadedNodeObj[nodeReceiverId]};
        for (let nodeObj of action.payload.nodes) {
          let nodeId = Object.keys(nodeObj)[0];
          newNodeReceiver.childNodeIds.push(nodeId)
          newAllUpdates[nodeId] = {...nodeObj[nodeId]};
        }
        newAllUpdates[nodeReceiverId] = newNodeReceiver;
        console.log("++++++++++++add nodes newAllUpdates",newAllUpdates)

        let nodeIdsArr = [];
        // return { ...state,nodeIdsArr}
        return { ...state,nodeIdsArr,allUpdates:newAllUpdates}
      }
      case 'DELETENODES': {
        let nodeIdsArr = [];
        return { ...state,nodeIdsArr }
      }

      default:
        throw new Error(`Unhandled type in reducer ${action, type}`);
    }
  }

  const [state, dispatch] = useReducer(reducer, { mode: "READY", allUpdates: {}, allSelected: [], nodeIdsArr: [] });
  console.log("\n###BASESTATE", state)

  // Dispatch Caller
  if (Object.keys(transferPayload).length > 0) {
    dispatch({ type: transferPayload.action, payload: transferPayload.payload })
    setTransferPayload({});
  }
  const transferDispatch = useCallback((action, payload) => { console.log("called!"); setTransferPayload({ action, payload }) }, []);

  let nodes = [];
  
  function buildNodeIdArray({folderArr=[],nodeIds=[],allUpdates={}}){
    for (let id of folderArr) {
      nodeIds.push(id);
      const nodeObjI = (allUpdates[id]) ? allUpdates[id] : loadedNodeObj[id];
      if (nodeObjI.isOpen) { buildNodeIdArray({folderArr:nodeObjI.childNodeIds,nodeIds,allUpdates}); }
    }
    return nodeIds;
  }
  const latestRootFolders = ((state.allUpdates['root']) ? state.allUpdates['root'] : loadedNodeObj['root']).childNodeIds;
  buildNodeArray(latestRootFolders);

  function buildNodeArray(folderArr, level = 0, parent = "") {
    for (let [i, id] of folderArr.entries()) {
      const nodeObjI = (state.allUpdates[id]) ? state.allUpdates[id] : loadedNodeObj[id];
      nodes.push(<Node key={`node${level}-${i}${parent}`} level={level} nodeObj={nodeObjI} nodeId={id} transferDispatch={transferDispatch} />)
      if (nodeObjI.isOpen) {
        buildNodeArray(nodeObjI.childNodeIds, level + 1, `${parent}-${i}`)
      }
    }
    if (folderArr.length === 0) {
      nodes.push(<Node key={`node${level}-0${parent}`} level={level} empty={true} />)
    }
  }



  return <>
    <button onClick={()=>{dispatch({ type: "ADDNODES",payload:{nodeReceiverId:'root',nodes:[{'rf3': {
        label: "root folder 3",
        childNodeIds: [],
        isOpen: false,
        appearance: "default",
        
      }}]}})}}>Add Node</button>
    <h1>Folders</h1>
    {nodes}
  </>
}

//appearance 'default','selected','inactive','dropperview'
const Node = React.memo(function Node(props) {
  console.log("Node", props)
  let numChildren = 0;
  if (props.nodeObj.childNodeIds && props.nodeObj.childNodeIds.length){
    numChildren = props.nodeObj.childNodeIds.length;
  }

  const indentPx = 20;
  if (props.empty) {
    return <div style={{
      width: "300px",
      padding: "4px",
      border: "1px solid black",
      backgroundColor: "white",
      margin: "2px"
    }} ><div className="noselect" style={{ textAlign: "center" }} >EMPTY</div></div>
  }
  const toggleLabel = (props.nodeObj.isOpen) ? "Close" : "Open";
  const toggle = <button onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    props.transferDispatch('TOGGLEFOLDER', { nodeId: props.nodeId, nodeObj: props.nodeObj })
    // props.actions().toggleFolder(props.nodeId,props.nodeObj);
  }}>{toggleLabel}</button>
  let bgcolor = "#e2e2e2";
  if (props.nodeObj.appearance === "selected") { bgcolor = "#6de5ff"; }
  return <div onClick={(e) => {
    props.transferDispatch('CLICKITEM', { nodeId: props.nodeId, nodeObj: props.nodeObj, shiftKey: e.shiftKey, metaKey: e.metaKey })
  }} style={{
    width: "300px",
    padding: "4px",
    border: "1px solid black",
    backgroundColor: bgcolor,
    margin: "2px"
  }} ><div className="noselect" style={{
    marginLeft: `${props.level * indentPx}px`
  }}>{toggle} [icon] {props.nodeObj.label} ({numChildren})</div></div>
})

