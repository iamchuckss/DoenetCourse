import React, { useState, useMemo, useCallback, useReducer } from 'react';
import './util.css';
import nanoid from 'nanoid';
import WithDropTarget from "../imports/dropTarget";
import WithDragItem from "../imports/dragItem";


//Simple folder contents
export default function browser() {
  console.log("=======START OF BROWSER")
  const [loadedNodeObj, setLoadedNodeObj] = useState(
    {
      'root': {childNodeIds:['rf1', 'rf2']},
      'rf1': {
        label: "root folder",
        childNodeIds: ['f1', 'f3', 'f4'],
        isOpen: true,
        appearance: "default",
        parentId: "root",
      },
      'rf2': {
        label: "root folder 2",
        childNodeIds: [],
        isOpen: true,
        appearance: "default",
        parentId: "root",
      },
      'f1': {
        label: "folder one",
        childNodeIds: ['f2'],
        isOpen: true,
        appearance: "default",
        parentId: "rf1",
      },
      'f2': {
        label: "folder two",
        childNodeIds: [],
        isOpen: false,
        appearance: "default",
        parentId: "f1",
      },
      'f3': {
        label: "folder three",
        childNodeIds: [],
        isOpen: false,
        appearance: "default",
        parentId: "rf1",
      },
      'f4': {
        label: "folder four",
        childNodeIds: [],
        isOpen: false, 
        appearance: "default",
        parentId: "rf1",
      },
    })
 
  const [transferPayload, setTransferPayload] = useState({})
  const initialState = { 
    mode: "READY", 
    allUpdates: {}, 
    allSelected: [], 
    nodeIdsArr: [], 
    draggedItemData: { id: null, previousParentId: null, sourceParentId: null },
    validDrop: false,
    nodeObjCache: {}
  }
  const [state, dispatch] = useReducer(reducer, initialState);
  console.log("\n###BASESTATE", state)

  // Dispatch Caller
  if (Object.keys(transferPayload).length > 0) {
    dispatch({ type: transferPayload.action, payload: transferPayload.payload })
    setTransferPayload({});
  }
  const transferDispatch = useCallback((action, payload) => { payload['loadedNodeObj'] = loadedNodeObj; setTransferPayload({ action, payload }) }, []);

  const createDropTarget = (id, element) => {
    const onDropEnter = () => {
      const dropTargetObj = { ...state.allUpdates[id] ? state.allUpdates[id] : loadedNodeObj[id] };
      if (!dropTargetObj.isOpen) {
        transferDispatch('TOGGLEFOLDER', { nodeId: id, nodeObj: dropTargetObj })
      }      
      transferDispatch("DROPENTER", {dropTargetId: id});
    } 
    
    const onDrop = () => {
      transferDispatch("DROP", {dropTargetId: id});
    }

    return (
      <WithDropTarget id={id} key={`droptarget-${id}`} onDrop={onDrop}>
        { element }
      </WithDropTarget>
    )
  }

  const createDragItem = (id, element) => {
    const onDragStart = () => {
      console.log("dispatch dragStart event: ", id)
      transferDispatch("DRAGSTART", { dragItemId: id });
    } 
    
    const onDragOver = (ev, id) => {
      console.log("dispatch dragged over event: ", id)
      const dropTargetObj = { ...state.allUpdates[id] ? state.allUpdates[id] : loadedNodeObj[id] };
      // if (!dropTargetObj.isOpen) {
      //   transferDispatch('TOGGLEFOLDER', { nodeId: id, nodeObj: dropTargetObj })
      // }      
      transferDispatch("DRAGOVER", {dropTargetId: id, ev: ev});
    }

    const onDragEnd = () => {
      console.log("dispatch dragEnd event: ", id)
      // transferDispatch("DRAGEND", {});
    }

    return (
      <WithDragItem id={id} key={`dragitem-${id}`} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} >
        { element }
      </WithDragItem>
    )
  }

  let nodes = [];  
  
  const latestRootFolders = ((state.allUpdates['root']) ? state.allUpdates['root'] : loadedNodeObj['root']).childNodeIds;
  buildNodeArray(latestRootFolders);

  function buildNodeArray(folderArr, level = 0, parent = "") {
    for (let [i, id] of folderArr.entries()) {
      const nodeObjI = (state.allUpdates[id]) ? state.allUpdates[id] : loadedNodeObj[id];
      const nodeItem = <Node key={`node${level}-${i}${parent}`} level={level} nodeObj={nodeObjI} nodeId={id} transferDispatch={transferDispatch} />;
      const draggableNodeItem = createDragItem(id, nodeItem);
      const draggableAndDroppableNodeItem = createDropTarget(id, draggableNodeItem);
      
      nodes.push(draggableAndDroppableNodeItem);
      if (nodeObjI.isOpen) {
        buildNodeArray(nodeObjI.childNodeIds, level + 1, `${parent}-${i}`)
      }
    }
    if (folderArr.length === 0) {
      nodes.push(<Node key={`node${level}-0${parent}`} level={level} empty={true} />)
    }
    
  }




  return <>
  
    <button onClick={()=>{
      let node = {
        label: "Untitled folder",
        childNodeIds: [],
        isOpen: false,
        appearance: "default",
      }
      let nodeObj = {};
      let Id = nanoid();
      nodeObj[Id] = node;
    dispatch({ type: "ADDNODES",payload:{loadedNodeObj,nodes:[nodeObj]}})
      }}>Add Folder</button>
    <h1>Folders</h1>
    {nodes}
  </>
}

function buildNodeIdArray({loadedNodeObj={},folderArr=[],nodeIds=[],allUpdates={}}){
  for (let id of folderArr) {
    const nodeObjI = (allUpdates[id]) ? allUpdates[id] : loadedNodeObj[id];
      nodeIds.push(id);
      if (nodeObjI.isOpen) { buildNodeIdArray({loadedNodeObj,folderArr:nodeObjI.childNodeIds,nodeIds,allUpdates}); }
  }
  return nodeIds;
}

function removeTreeNodeIdsFromAllSelected({allSelected,loadedNodeObj,allUpdates,nodeId}){
  allSelected.splice(allSelected.indexOf(nodeId),1)
  const nodeObjI = (allUpdates[nodeId]) ? allUpdates[nodeId] : loadedNodeObj[nodeId];
    for (let nodeChildId of nodeObjI.childNodeIds){
      removeTreeNodeIdsFromAllSelected({allSelected,loadedNodeObj,allUpdates,nodeId:nodeChildId})
    }
  }

  function selectVisibleTree({allSelected,loadedNodeObj,nodeId,newAllUpdates,startWithChildren=false}){
    if (!startWithChildren) {allSelected.push(nodeId);}
    const nodeObjI = (newAllUpdates[nodeId]) ? newAllUpdates[nodeId] : loadedNodeObj[nodeId];
      if (startWithChildren || nodeObjI["appearance"] !== "selected"){
      let newNodeObj = {...nodeObjI}
      newNodeObj["appearance"] = "selected";
      newAllUpdates[nodeId] = newNodeObj;
        //if open folder and isn't already selected then select the folder's children
        if (nodeObjI.isOpen){
          for (let nodeChildId of nodeObjI.childNodeIds){
            selectVisibleTree({allSelected,loadedNodeObj,nodeId:nodeChildId,newAllUpdates})
          }
        }
      }
    }



function reducer(state, action) {
  console.log("----------REDUCER type:", action.type, "transferPayload:", action.payload)
  const loadedNodeObj = action.payload.loadedNodeObj;
  const draggedShadowId = "draggedshadow";

  switch (action.type) {
    case 'TOGGLEFOLDER': {
      let newNodeObj = { ...action.payload.nodeObj }
      let newAllUpdates = { ...state.allUpdates };
      let newAllSelected = [...state.allSelected]
      newNodeObj["isOpen"] = !newNodeObj["isOpen"];      
      newAllUpdates[action.payload.nodeId] = newNodeObj;

      if (newNodeObj["isOpen"] && newNodeObj.appearance === 'selected'){
        //Opening a selected folder. Select all children
        selectVisibleTree({allSelected:newAllSelected,loadedNodeObj,nodeId:action.payload.nodeId,newAllUpdates,startWithChildren:true})
      }

      // If closing a folder, deselect itself and children
      if (!newNodeObj["isOpen"]) {
        let processQueue = [action.payload.nodeId];

        while (processQueue.length != 0) {
          const currentNodeObjId = processQueue.pop();
          const currentNodeObj = (newAllUpdates[currentNodeObjId]) ? newAllUpdates[currentNodeObjId] : loadedNodeObj[currentNodeObjId];          
          // deselect current node
          currentNodeObj["appearance"] = "default";
          newAllUpdates[currentNodeObjId] = currentNodeObj;
          newAllSelected = newAllSelected.splice(newAllSelected.indexOf(currentNodeObjId), 1);

          for (let childNodeObjId of currentNodeObj.childNodeIds) {
            processQueue.push(childNodeObjId);
          }
        }
      }

      let nodeIdsArr = [];
      return { ...state, allUpdates:newAllUpdates,nodeIdsArr,allSelected:newAllSelected };
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

      let newNodeObj = { ...action.payload.nodeObj }
      let newAllUpdates = { ...state.allUpdates };
      let newAllSelected = [...state.allSelected ];
      let nodeIdsArr = state.nodeIdsArr;

      if (!metakey && !shiftKey) {
        //No shift or control 
        //Deselect all selected nodes
        newAllSelected = [];
        for (let selectedNodeId of state.allSelected){
          const nodeObj = (state.allUpdates[selectedNodeId]) ? state.allUpdates[selectedNodeId] : loadedNodeObj[selectedNodeId];
          let selectedNodeObj = {...nodeObj}
          selectedNodeObj["appearance"] = "default";
          newAllUpdates[selectedNodeId] = selectedNodeObj;
        }

        //If selecting node then select all in tree 
        //if deselecting then we are done already
        // const nodeObj = (state.allUpdates[action.payload.nodeId]) ? state.allUpdates[action.payload.nodeId] : loadedNodeObj[action.payload.nodeId];
        if (action.payload.nodeObj.appearance !== "selected"){
          selectVisibleTree({allSelected:newAllSelected,loadedNodeObj,nodeId:action.payload.nodeId,newAllUpdates})
        }
      
      } else if (metakey && !shiftKey) {
        //Control so add this tree to the selection
        if (action.payload.nodeObj.appearance !== "selected"){
          selectVisibleTree({allSelected:newAllSelected,loadedNodeObj,nodeId:action.payload.nodeId,newAllUpdates})
        }
      
      } else if (!metakey && shiftKey) {
        //Shift is down so add a whole range of items
        let lastNodeIdSelected = state.allSelected[state.allSelected.length - 1];
        if (lastNodeIdSelected !== undefined) {
        // newNodeObj["appearance"] = "selected";
        //Find range of nodes and turn selection on for those that are off
        //Build array of nodeids if length is 0
        //Only build node ids array if we need it
          if (nodeIdsArr.length === 0){
            const latestRootFolders = ((state.allUpdates['root']) ? state.allUpdates['root'] : loadedNodeObj['root']).childNodeIds;
            nodeIdsArr = buildNodeIdArray({loadedNodeObj,folderArr:latestRootFolders,allUpdates:state.allUpdates});
          }
          let indexOfLastNodeId = nodeIdsArr.indexOf(lastNodeIdSelected);
          let indexOfCurrentNodeId = nodeIdsArr.indexOf(action.payload.nodeId);
          let rangeArr = nodeIdsArr.slice(Math.min(indexOfLastNodeId,indexOfCurrentNodeId), Math.max(indexOfLastNodeId,indexOfCurrentNodeId)+1);
          for (let nodeId of rangeArr){
            let nodeObj = (newAllUpdates[nodeId]) ? newAllUpdates[nodeId] : loadedNodeObj[nodeId];
            if (nodeObj["appearance"] !== "selected"){
              selectVisibleTree({allSelected:newAllSelected,loadedNodeObj,nodeId,newAllUpdates})
              // let newNodeObj = { ...nodeObj }
        //       state.allSelected.push(nodeId);
        //       allUpdates[nodeId] = newNodeObj;
            }
            
          }

        }
      }

      if (newAllSelected.length === 0){ mode = "READY"}
      return { ...state, allUpdates:newAllUpdates,nodeIdsArr,allSelected:newAllSelected,mode };
    }
    case 'ADDNODES': {
      let newAllUpdates = {...state.allUpdates}
      let nodeParentId = state.allSelected[state.allSelected.length - 1];
        if (nodeParentId === undefined) { nodeParentId = 'root'; } //No selections add to root
      let newNodeParent = {...(newAllUpdates[nodeParentId]) ? newAllUpdates[nodeParentId] : loadedNodeObj[nodeParentId]};
      for (let nodeObj of action.payload.nodes) {
        let nodeId = Object.keys(nodeObj)[0];
        newNodeParent.childNodeIds.push(nodeId)
        nodeObj[nodeId]["parentId"] = nodeParentId;
        newAllUpdates[nodeId] = {...nodeObj[nodeId]};
      }
      newAllUpdates[nodeParentId] = newNodeParent;
      let nodeIdsArr = [];
      return { ...state,nodeIdsArr,allUpdates:newAllUpdates}
    }
    case 'DELETENODES': {
      //Find parent and splice out of array of children
      let newAllSelected = [...state.allSelected];
      removeTreeNodeIdsFromAllSelected({allSelected:newAllSelected,loadedNodeObj,allUpdates:state.allUpdates,nodeId:action.payload.nodeId});

      let newAllUpdates = {...state.allUpdates}
      let nodeObj = { ...action.payload.nodeObj }
      let nodeParentId = nodeObj.parentId;
      let newNodeParent = {...(newAllUpdates[nodeParentId]) ? newAllUpdates[nodeParentId] : loadedNodeObj[nodeParentId]};
      let newChildNodeIds = [...newNodeParent.childNodeIds];
      newChildNodeIds.splice(newChildNodeIds.indexOf(action.payload.nodeId),1)
      newNodeParent.childNodeIds = newChildNodeIds;
      newAllUpdates[nodeParentId] = newNodeParent;
      let nodeIdsArr = [];
      let mode = state.mode;
      if (newAllSelected.length === 0){ mode = "READY"}
      return { ...state,nodeIdsArr,allUpdates:newAllUpdates,allSelected:newAllSelected,mode }
    }
    case 'DRAGSTART': { 
      const id = action.payload.dragItemId;
      const draggedObject = { ...state.allUpdates[id] ? state.allUpdates[id] : loadedNodeObj[id] };
      const draggedItemData = {
        id: id,
        previousParentId: draggedObject.parentId,
        sourceParentId: draggedObject.parentId,
      }
      const newAllUpdates = { ...state.allUpdates }
      const draggedNode = { ...newAllUpdates[id] ? newAllUpdates[id] : loadedNodeObj[id]};
      draggedNode.appearance = "dragged";
      newAllUpdates[id] = draggedNode;

      return { ...state, draggedItemData: draggedItemData, allUpdates: newAllUpdates }
    }
    case 'DRAGEND': { 
      return { ...state, draggedItemData: null}
    }
    case 'DROPENTER': { 

      const { id, previousParentId, sourceParentId } = { ...state.draggedItemData };
      const dragItemId = id;
      const dropTargetId = action.payload.dropTargetId;
      
      // move draggedItem to dropTarget
      const newAllUpdates = { ...state.allUpdates }
      const previousParentNode = { ...newAllUpdates[previousParentId] ? newAllUpdates[previousParentId] : loadedNodeObj[previousParentId]};
      const newParentNode = { ...newAllUpdates[dropTargetId] ? newAllUpdates[dropTargetId] : loadedNodeObj[dropTargetId]};
      
      if (previousParentId == dropTargetId) { // prevent dropping into the same parent 
        return { ...state };
      }

      let previousList = [...previousParentNode.childNodeIds];
      let currentList = [...newParentNode.childNodeIds];

      // remove from previous list, delete from newAllUpdates
      if (previousParentId !== sourceParentId) {
        const indexInList = previousList.findIndex(itemId => itemId == draggedShadowId);
        if (indexInList > -1) {
          previousList.splice(indexInList, 1);
        }
        if (newAllUpdates[draggedShadowId]) {
          delete newAllUpdates[draggedShadowId];
        }
      }
      if (dropTargetId !== sourceParentId && dropTargetId !== dragItemId) {
        // add to current list
        const draggedShadowNodeObj = {
          label: "SHADOW",
          childNodeIds: [],
          isOpen: false,
          appearance: "dropperview",
          parentId: dropTargetId,
        }
        newAllUpdates[draggedShadowId] = draggedShadowNodeObj;
        currentList.push(draggedShadowId);
      }
      
      previousParentNode.childNodeIds = previousList;
      newAllUpdates[previousParentId] = previousParentNode;
      newParentNode.childNodeIds = currentList;
      newAllUpdates[dropTargetId] = newParentNode;
            
      const updatedDraggedItemData = { ...state.draggedItemData };
      updatedDraggedItemData.previousParentId = dropTargetId !== dragItemId ? dropTargetId : sourceParentId;
      let nodeIdsArr = [];
      
      return { ...state, nodeIdsArr, draggedItemData: updatedDraggedItemData, allUpdates: newAllUpdates }
    }
    case 'DRAGOVER': { 
      const { id, previousParentId, sourceParentId } = { ...state.draggedItemData };
      const dragItemId = id;
      const dropTargetId = action.payload.dropTargetId;
      
      const updatedDraggedItemData = { ...state.draggedItemData };
      const newAllUpdates = { ...state.allUpdates }
      const previousParentNode = { ...newAllUpdates[previousParentId] ? newAllUpdates[previousParentId] : loadedNodeObj[previousParentId]};
      let previousList = [...previousParentNode.childNodeIds];

      // if the item is dragged over itself, remove any shadow then return
      if (dragItemId == dropTargetId || dropTargetId == draggedShadowId) {
        if (dragItemId == dropTargetId && newAllUpdates[draggedShadowId]) {
          const indexInList = previousList.findIndex(itemId => itemId == draggedShadowId);
          console.log("HERE deleting", indexInList)
          if (indexInList > -1) {
            previousList.splice(indexInList, 1);
          }       
          newAllUpdates[previousParentId].childNodeIds = previousList;
          delete newAllUpdates[draggedShadowId];
        }
        return { ...state, allUpdates: newAllUpdates };
      }
      

      // add shadow into dropTargetNode.parentId
      const dropTargetNode = { ...newAllUpdates[dropTargetId] ? newAllUpdates[dropTargetId] : loadedNodeObj[dropTargetId]};
      const dropTargetParentNode = { ...newAllUpdates[dropTargetNode.parentId] ? newAllUpdates[dropTargetNode.parentId] : loadedNodeObj[dropTargetNode.parentId]};
      let dropTargetParentChildList = [...dropTargetParentNode.childNodeIds];      

      if (previousParentId !== dropTargetNode.parentId || !newAllUpdates[draggedShadowId]) {
        const draggedShadowNodeObj = {
          label: "SHADOW",
          childNodeIds: [],
          isOpen: false,
          appearance: "dropperview",
          parentId: dropTargetNode.parentId,
        }
        updatedDraggedItemData.previousParentId = dropTargetNode.parentId;
        newAllUpdates[draggedShadowId] = draggedShadowNodeObj;
      }

      // add the shadow after the dragged over item
      const dropTargetIndex = dropTargetParentChildList.findIndex(itemId => itemId == dropTargetId);
      dropTargetParentChildList = dropTargetParentChildList.filter(itemId => itemId != draggedShadowId);
      dropTargetParentChildList.splice(dropTargetIndex, 0, draggedShadowId);

      dropTargetParentNode.childNodeIds = dropTargetParentChildList;
      newAllUpdates[dropTargetNode.parentId] = dropTargetParentNode;
      
      // // move draggedItem to dropTarget
      // const newAllUpdates = { ...state.allUpdates }
      // const previousParentNode = { ...newAllUpdates[previousParentId] ? newAllUpdates[previousParentId] : loadedNodeObj[previousParentId]};
      // const newParentNode = { ...newAllUpdates[dropTargetId] ? newAllUpdates[dropTargetId] : loadedNodeObj[dropTargetId]};
      
      // if (previousParentId == dropTargetId) { // prevent dropping into the same parent 
      //   return { ...state };
      // }

      // let previousList = [...previousParentNode.childNodeIds];
      // let currentList = [...newParentNode.childNodeIds];

      // // remove from previous list, delete from newAllUpdates
      // if (previousParentId !== sourceParentId) {
      //   const indexInList = previousList.findIndex(itemId => itemId == draggedShadowId);
      //   if (indexInList > -1) {
      //     previousList.splice(indexInList, 1);
      //   }
      //   if (newAllUpdates[draggedShadowId]) {
      //     delete newAllUpdates[draggedShadowId];
      //   }
      // }
      // if (dropTargetId !== sourceParentId && dropTargetId !== dragItemId) {
      //   // add to current list
      //   const draggedShadowNodeObj = {
      //     label: "SHADOW",
      //     childNodeIds: [],
      //     isOpen: false,
      //     appearance: "dropperview",
      //     parentId: dropTargetId,
      //   }
      //   newAllUpdates[draggedShadowId] = draggedShadowNodeObj;
      //   currentList.push(draggedShadowId);
      // }
      
      // previousParentNode.childNodeIds = previousList;
      // newAllUpdates[previousParentId] = previousParentNode;
      // newParentNode.childNodeIds = currentList;
      // newAllUpdates[dropTargetId] = newParentNode;
            
      // const updatedDraggedItemData = { ...state.draggedItemData };
      // updatedDraggedItemData.previousParentId = dropTargetId !== dragItemId ? dropTargetId : sourceParentId;
      // let nodeIdsArr = [];
      
      // return { ...state, nodeIdsArr, draggedItemData: updatedDraggedItemData, allUpdates: newAllUpdates }


      return { ...state, draggedItemData: updatedDraggedItemData, allUpdates: newAllUpdates }
    }
    case 'DROP': { 
      const { id, previousParentId, sourceParentId } = { ...state.draggedItemData };

      const newAllUpdates = { ...state.allUpdates }
      // item moved out of original parent
      if (previousParentId !== sourceParentId) {
        const previousParentNode = { ...newAllUpdates[previousParentId] ? newAllUpdates[previousParentId] : loadedNodeObj[previousParentId]};
        let previousList = [...previousParentNode.childNodeIds];
        
        // replace shadow in previousParentId with draggedItem
        let indexInList = previousList.findIndex(itemId => itemId == draggedShadowId);
        if (indexInList > -1) {
          previousList[indexInList] = id;
        }
        
        // remove draggedItem from sourceParentId
        const sourceParentNode = { ...newAllUpdates[sourceParentId] ? newAllUpdates[sourceParentId] : loadedNodeObj[sourceParentId]};
        let sourceParentList = [...sourceParentNode.childNodeIds];
        indexInList = sourceParentList.findIndex(itemId => itemId == id);
        if (indexInList > -1) {
          sourceParentList.splice(indexInList, 1);
        }

        newAllUpdates[id].parentId = previousParentId;
        newAllUpdates[previousParentId].childNodeIds = previousList;
        newAllUpdates[sourceParentId].childNodeIds = sourceParentList;
      }
      if (newAllUpdates[draggedShadowId]) {
        delete newAllUpdates[draggedShadowId];
      }
      return { ...state, draggedItemData: null, allUpdates: newAllUpdates };
    }
    default:
      throw new Error(`Unhandled type in reducer ${action, action.type}`);
  }
}

//appearance 'default','selected','inactive','dropperview', 'dragged'
const Node = React.memo(function Node(props) {
  console.log("Node", props)
  let numChildren = 0;
  if (props.nodeObj && props.nodeObj.childNodeIds && props.nodeObj.childNodeIds.length){
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
  const deleteNode = <button onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    props.transferDispatch('DELETENODES', { nodeId: props.nodeId, nodeObj: props.nodeObj })
    // props.actions().toggleFolder(props.nodeId,props.nodeObj);
  }}>X</button>
  const toggleLabel = (props.nodeObj.isOpen) ? "Close" : "Open";
  const toggle = <button onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    props.transferDispatch('TOGGLEFOLDER', { nodeId: props.nodeId, nodeObj: props.nodeObj })
    // props.actions().toggleFolder(props.nodeId,props.nodeObj);
  }}>{toggleLabel}</button>
  let bgcolor = "#e2e2e2";
  if (props.nodeObj.appearance === "selected") { bgcolor = "#6de5ff"; }
  if (props.nodeObj.appearance === "dropperview") { bgcolor = "#53ff47"; }
  if (props.nodeObj.appearance === "dragged") { bgcolor = "#f3ff35"; }
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
  }}>{toggle} [icon] {props.nodeObj.label} ({numChildren}){deleteNode}</div></div>
})
