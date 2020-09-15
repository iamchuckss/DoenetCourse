import React, { useState, useMemo, useCallback, useReducer } from 'react';

//Simple folder contents
export default function browser() {
  console.log("#START OF BROWSER")
  const [contentObj, setContentObj] = useState(
    {
      'rf1': {
        label: "root folder",
        contentIds: ['f1', 'f3'],
        isOpen: true,
        isSelected: false,
      },
      'rf2': {
        label: "root folder 2",
        contentIds: ['f4'],
        isOpen: true,
        isSelected: false,
      },
      'f1': {
        label: "folder one",
        contentIds: ['f2'],
        isOpen: true,
        isSelected: false,
      },
      'f2': {
        label: "folder two",
        contentIds: [],
        isOpen: false,
        isSelected: false,
      },
      'f3': {
        label: "folder three",
        contentIds: [],
        isOpen: false,
        isSelected: false,
      },
      'f4': {
        label: "folder four",
        contentIds: [],
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
        let nodeObj = { ...action.payload.contentObj }
        nodeObj["isOpen"] = !nodeObj["isOpen"];
        let allUpdates = { ...state.allUpdates };
        allUpdates[action.payload.nodeId] = nodeObj;
        return { ...state, allUpdates };
      }
      case 'CLICKITEM': {
        const metakey = action.payload.metaKey;
        const shiftKey = action.payload.shiftKey;

        //Don't do anything if both shift and meta keys are pressed
        if (metakey && shiftKey) {
          return { ...state };
        }

        let nodeObj = { ...action.payload.contentObj }
        nodeObj["isSelected"] = !nodeObj["isSelected"];
        let allUpdates = { ...state.allUpdates };


        if (!metakey && !shiftKey) {
          //No shift or control so only select/deselect this node
          for (let nodeId of state.allSelected) {
            let deselectedNode = { ...allUpdates[nodeId] }
            deselectedNode.isSelected = false;
            allUpdates[nodeId] = deselectedNode
          }
          state.allSelected = [action.payload.nodeId];
        } else if (metakey && !shiftKey) {
          //Control so add just this one
          state.allSelected.push(action.payload.nodeId)
        } else if (!metakey && shiftKey) {
          console.log('ADD RANGE');
          //Shift so add whole range
          let lastNodeIdSelected = state.allSelected[state.allSelected.length - 1];
          if (lastNodeIdSelected !== undefined) {
            console.log('index of last selected')
            // const indexOfLastNodeIdSelected = 
            // console.log("indexOfLastNodeIdSelected",indexOfLastNodeIdSelected)
          }
        }


        allUpdates[action.payload.nodeId] = nodeObj;
        return { ...state, allUpdates };
      }
      case 'ADDITEMS': {
        return { ...state }
      }
      case 'DELETEITEMS': {
        return { ...state }
      }

      default:
        throw new Error(`Unhandled type in reducer ${action, type}`);
    }
  }

  const [state, dispatch] = useReducer(reducer, { mode: "READY", allUpdates: {}, allSelected: [] });
  console.log("\n###BASESTATE", state)

  // Dispatch Caller
  if (Object.keys(transferPayload).length > 0) {
    dispatch({ type: transferPayload.action, payload: transferPayload.payload })
    setTransferPayload({});
  }
  const transferDispatch = useCallback((action, payload) => { setTransferPayload({ action, payload }) }, []);
  // const transferDispatch =  useCallback(setTransferPayload(action,payload) },[]);

  let nodes = [];
  let collectOpenNodeIds = [];
  buildNodeArray(rootFolders);

  function buildNodeArray(folderArr, level = 0, parent = "") {
    for (let [i, id] of folderArr.entries()) {
      collectOpenNodeIds.push(id);
      const contentObjI = (state.allUpdates[id]) ? state.allUpdates[id] : contentObj[id];
      nodes.push(<Node key={`node${level}-${i}${parent}`} level={level} contentObj={contentObjI} nodeId={id} transferDispatch={transferDispatch} />)
      if (contentObjI.isOpen) {
        buildNodeArray(contentObjI.contentIds, level + 1, `${parent}-${i}`)
      }
    }
    if (folderArr.length === 0) {
      nodes.push(<Node key={`node${level}-0${parent}`} level={level} empty={true} />)
    }
  }
  if (collectOpenNodeIds.length !== openNodeIds.length) {
    setOpenNodeIds(collectOpenNodeIds);
  }
  console.log("openNodeIds", openNodeIds)


  return <>
    <h1>Folders</h1>
    {nodes}
  </>
}

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
  const toggleLabel = (props.contentObj.isOpen) ? "Close" : "Open";
  const toggle = <button onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    props.transferDispatch('TOGGLEFOLDER', { nodeId: props.nodeId, contentObj: props.contentObj })
    // props.actions().toggleFolder(props.nodeId,props.contentObj);
  }}>{toggleLabel}</button>
  let bgcolor = "#e2e2e2";
  if (props.contentObj.isSelected) { bgcolor = "#6de5ff"; }
  return <div onClick={(e) => {
    props.transferDispatch('CLICKITEM', { nodeId: props.nodeId, contentObj: props.contentObj, shiftKey: e.shiftKey, metaKey: e.metaKey })
  }} style={{
    width: "300px",
    padding: "4px",
    border: "1px solid black",
    backgroundColor: bgcolor,
    margin: "2px"
  }} ><div style={{
    marginLeft: `${props.level * indentPx}px`
  }}>{toggle} [icon] {props.contentObj.label} ({props.contentObj.contentIds.length})</div></div>
})

