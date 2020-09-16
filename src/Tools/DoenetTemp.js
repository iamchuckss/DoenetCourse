import React, { useState, useMemo, useCallback, useReducer } from 'react';

//Simple folder contents
export default function browser() {
  console.log("#START OF BROWSER")
  const [loadedNodeObj, setLoadedNodeObj] = useState(
    {
      'rf1': {
        label: "root folder",
        childNodeIds: ['f1', 'f3'],
        isOpen: true,
        isSelected: false,
      },
      'rf2': {
        label: "root folder 2",
        childNodeIds: ['f4'],
        isOpen: true,
        isSelected: false,
      },
      'f1': {
        label: "folder one",
        childNodeIds: ['f2'],
        isOpen: true,
        isSelected: false,
      },
      'f2': {
        label: "folder two",
        childNodeIds: [],
        isOpen: false,
        isSelected: false,
      },
      'f3': {
        label: "folder three",
        childNodeIds: [],
        isOpen: false,
        isSelected: false,
      },
      'f4': {
        label: "folder four",
        childNodeIds: [],
        isOpen: false,
        isSelected: false,
      }
    })
  const rootFolders = ['rf1', 'rf2']
  const [transferPayload, setTransferPayload] = useState({})
  const [openNodeIds, setOpenNodeIds] = useState([])

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
          nodeObj["isSelected"] = !nodeObj["isSelected"];
          for (let nodeId of state.allSelected) {
            let deselectedNode = { ...allUpdates[nodeId] }
            deselectedNode.isSelected = false;
            allUpdates[nodeId] = deselectedNode
          }
          if (nodeObj["isSelected"]){
            state.allSelected = [action.payload.nodeId];
          }else{
            state.allSelected = [];
          }
        } else if (metakey && !shiftKey) {
          //Control so add just this one
          nodeObj["isSelected"] = !nodeObj["isSelected"];
          if (nodeObj["isSelected"]){
            state.allSelected.push(action.payload.nodeId)
          }else{
            //remove nodeId
            state.allSelected.splice(state.allSelected.indexOf(action.payload.nodeId),1)
          }
        } else if (!metakey && shiftKey) {
          //Shift so add whole range
          let lastNodeIdSelected = state.allSelected[state.allSelected.length - 1];
          if (lastNodeIdSelected !== undefined) {
          nodeObj["isSelected"] = true;

            //Find range of nodes and turn selection on for those that are off
            //Build array of nodeids if length is 0
            //Only build node ids array if we need it
            if (nodeIdsArr.length === 0){
              nodeIdsArr = buildNodeIdArray({folderArr:rootFolders,allUpdates:state.allUpdates});
            }
            let indexOfLastNodeId = nodeIdsArr.indexOf(lastNodeIdSelected);
            let indexOfCurrentNodeId = nodeIdsArr.indexOf(action.payload.nodeId);
            let rangeArr = nodeIdsArr.slice(Math.min(indexOfLastNodeId,indexOfCurrentNodeId), Math.max(indexOfLastNodeId,indexOfCurrentNodeId));
            for (let nodeId of rangeArr){
              let nodeObj = (allUpdates[nodeId]) ? allUpdates[nodeId] : loadedNodeObj[nodeId];
              if (!nodeObj.isSelected){
                let newNodeObj = { ...nodeObj }
                newNodeObj["isSelected"] = true;
                state.allSelected.push(nodeId);
                allUpdates[nodeId] = newNodeObj;
              }
              
            }
            //TODO: set nodeIdsArr to empty array if it changes

          }
        }


        allUpdates[action.payload.nodeId] = nodeObj;
        if (state.allSelected.length === 0){ mode = "READY"}
        return { ...state, allUpdates,nodeIdsArr,mode };
      }
      case 'ADDITEMS': {
        let nodeIdsArr = [];
        return { ...state,nodeIdsArr }
      }
      case 'DELETEITEMS': {
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
  const transferDispatch = useCallback((action, payload) => { setTransferPayload({ action, payload }) }, []);
  // const transferDispatch =  useCallback(setTransferPayload(action,payload) },[]);

  let nodes = [];
  
  function buildNodeIdArray({folderArr=[],nodeIds=[],allUpdates={}}){
    for (let id of folderArr) {
      nodeIds.push(id);
      const nodeObjI = (allUpdates[id]) ? allUpdates[id] : loadedNodeObj[id];
      if (nodeObjI.isOpen) { buildNodeIdArray({folderArr:nodeObjI.childNodeIds,nodeIds,allUpdates}); }
    }
    return nodeIds;
  }

  buildNodeArray(rootFolders);

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
    <h1>Folders</h1>
    {nodes}
  </>
}

//appearance 'default','selected','inactive','droppreview'
const Node = React.memo(function Node(props) {
  console.log("Node", props)

  const indentPx = 20;
  if (props.empty) {
    return <div style={{
      width: "300px",
      padding: "4px",
      border: "1px solid black",
      backgroundColor: "white",
      margin: "2px"
    }} ><div style={{ textAlign: "center" }} >EMPTY</div></div>
  }
  const toggleLabel = (props.nodeObj.isOpen) ? "Close" : "Open";
  const toggle = <button onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    props.transferDispatch('TOGGLEFOLDER', { nodeId: props.nodeId, nodeObj: props.nodeObj })
    // props.actions().toggleFolder(props.nodeId,props.nodeObj);
  }}>{toggleLabel}</button>
  let bgcolor = "#e2e2e2";
  if (props.nodeObj.isSelected) { bgcolor = "#6de5ff"; }
  return <div onClick={(e) => {
    props.transferDispatch('CLICKITEM', { nodeId: props.nodeId, nodeObj: props.nodeObj, shiftKey: e.shiftKey, metaKey: e.metaKey })
  }} style={{
    width: "300px",
    padding: "4px",
    border: "1px solid black",
    backgroundColor: bgcolor,
    margin: "2px"
  }} ><div style={{
    marginLeft: `${props.level * indentPx}px`
  }}>{toggle} [icon] {props.nodeObj.label} ({props.nodeObj.childNodeIds.length})</div></div>
})

