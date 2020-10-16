import React, { useState, useMemo, useCallback, useReducer, useEffect } from 'react';
import '../Tools/util.css';
import nanoid from 'nanoid';
import WithDropTarget from "./dropTarget";
import WithDragItem from "./dragItem";


export default function Browser(props) {
  const [browserId,setBrowserId] = useState("");
  useEffect(()=>{
    const browserid = nanoid();
    setBrowserId(browserid);
  },[]);
  console.log("=======START OF BROWSER",browserId)

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
        childNodeIds: ['f5'],
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
      'f5': {
        label: "folder 5",
        childNodeIds: ['f6','f7','f8'],
        isOpen: true, 
        appearance: "default",
        parentId: "rf2",
      },
      'f6': {
        label: "folder 6",
        childNodeIds: [],
        isOpen: false, 
        appearance: "default",
        parentId: "f5",
      },
      'f7': {
        label: "folder 7",
        childNodeIds: [],
        isOpen: false, 
        appearance: "default",
        parentId: "f5",
      },
      'f8': {
        label: "folder 8",
        childNodeIds: [],
        isOpen: false, 
        appearance: "default",
        parentId: "f5",
      },
    })
 
  const [transferPayload, setTransferPayload] = useState({})
  const [clearSelection, setClearSelection] = useState(false);

  const initialState = { 
    mode: "READY",
    allUpdates: {}, 
    allSelected: [], 
    nodeIdsArr: [], 
    draggedItemData: { id: null, previousParentId: null, sourceParentId: null },
    validDrop: false,
    dragState: {}
  }
  const [state, dispatch] = useReducer(reducer, initialState);
  console.log("\n###BASESTATE", state)
  if (clearSelection){
    dispatch({ type: "CLEARALLSELECTED" })
    setClearSelection(false);
  }
 
  // Dispatch Caller
  if (Object.keys(transferPayload).length > 0) {
    dispatch({ type: transferPayload.action, payload: transferPayload.payload })
    setTransferPayload({});
  }
  const transferDispatch = useCallback((action, payload) => { payload['loadedNodeObj'] = loadedNodeObj; setTransferPayload({ action, payload }) }, []);

  const createDropTarget = (id, element) => {
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
      let draggedItemIds = new Set(state.allSelected);

      if (draggedItemIds.has(id)) {
        // if current dragged item selected
        // remove items at lower hierarchy in selected items
        let processQueue = [ ...state.allSelected ];
        while (processQueue.length != 0) {
          const currentNodeObjId = processQueue.pop();
          const currentNodeObj = getNodeObj({id:currentNodeObjId, stateList:[state.dragState, state.allUpdates, loadedNodeObj]});
          for (let childNodeObjId of currentNodeObj.childNodeIds) {
            if (draggedItemIds.has(childNodeObjId)) {
              draggedItemIds.delete(childNodeObjId);
              processQueue = processQueue.splice(processQueue.findIndex(id => id == childNodeObjId), 1);
            } else {
              processQueue.push(childNodeObjId);
            }          
          }
        }
        draggedItemIds = [ ...draggedItemIds ];
      } else {
        // current dragged item not selected, deselect other items
        setClearSelection(true);
        draggedItemIds = [id]
      }
      
      // temp placeholder solution for drag selection
      if (draggedItemIds.length == 0) draggedItemIds = [id];

      for (let draggedItemId of draggedItemIds) {
        let dragItemObj = getNodeObj({id:draggedItemId, stateList:[state.dragState, state.allUpdates, loadedNodeObj]});
        if (dragItemObj.isOpen) {
          // close dragItem if open
          transferDispatch('TOGGLEFOLDER', { nodeId: draggedItemId, nodeObj: dragItemObj })
        }      
      }
      
      transferDispatch("DRAGSTART", { draggedItemIds: draggedItemIds });
    } 
    
    const onDragOver = (ev, id) => {
      // const { draggedItemIds } = state.draggedItemData;
      // const dropTargetObj = { ...state.allUpdates[id] ? state.allUpdates[id] : loadedNodeObj[id] };
      // const isDraggedOverSelf = draggedItemIds.has(id);
      // if (!dropTargetObj.isOpen && !isDraggedOverSelf) {
      //   transferDispatch('TOGGLEFOLDER', { nodeId: id, nodeObj: dropTargetObj })
      // }      
      transferDispatch("DRAGOVER", {dropTargetId: id, ev: ev});
    }

    const onDragEnd = () => {
      transferDispatch("DRAGEND", {});
    }

    return (
      <WithDragItem id={id} key={`dragitem-${id}`} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} >
        { element }
      </WithDragItem>
    )
  }

  const createDnDItem = (id, element) => {
    const draggableNodeItem = createDragItem(id, element);
    const draggableAndDroppableNodeItem = createDropTarget(id, draggableNodeItem);
    return draggableAndDroppableNodeItem;
  }

  let nodes = [];  
  
  const latestRootFolders = getNodeObj({id:"root", stateList:[state.dragState, state.allUpdates, loadedNodeObj]}).childNodeIds;
  buildNodeArray(latestRootFolders);

  function buildNodeArray(folderArr, level = 0, parent = "root") {
    for (let [i, id] of folderArr.entries()) {
      const nodeObjI = getNodeObj({id:id, stateList:[state.dragState, state.allUpdates, loadedNodeObj]})
      const nodeItem = <Node key={`node${level}-${i}${parent}-${i}`} level={level} nodeObj={nodeObjI} nodeId={id} browserId={browserId} transferDispatch={transferDispatch} setClearSelection={setClearSelection} />;
      const draggableAndDroppableNodeItem = createDnDItem(id, nodeItem);
      nodes.push(draggableAndDroppableNodeItem);
      // nodes.push(nodeItem);
      if (nodeObjI.isOpen) {
        buildNodeArray(nodeObjI.childNodeIds, level + 1, id)
      }
    }
    if (folderArr.length === 0) {
      const emptyNodeId = `EMPTY-${parent}`;
      const emptyNode = <Node key={`node${level}-0${parent}`} level={level} empty={true} />;
      nodes.push(createDnDItem(emptyNodeId, emptyNode));
    }
  }




  return <>
  
    <button 
    data-doenet-browserid={browserId}
    onMouseDown={e=>{ e.preventDefault(); }}
    onClick={()=>{
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
  let visibleChildren = visibleChildNodeIds({loadedNodeObj,nodeId,newAllUpdates});
  if (startWithChildren) {
    visibleChildren.shift();
  } 
  for (let nodeId of visibleChildren){
    const nodeObj = (newAllUpdates[nodeId]) ? newAllUpdates[nodeId] : loadedNodeObj[nodeId];
    let newNodeObj = {...nodeObj}
    newNodeObj["appearance"] = "selected";
    newAllUpdates[nodeId] = newNodeObj;
    allSelected.push(nodeId);
  }
  // allSelected = allSelected.concat(visibleChildren)
  console.log(">>>visibleChildren",visibleChildren)
  console.log(">>>allSelected",allSelected)
  // if (!startWithChildren) {allSelected.push(nodeId);}
  // const nodeObj = (newAllUpdates[nodeId]) ? newAllUpdates[nodeId] : loadedNodeObj[nodeId];
  //   if (startWithChildren || nodeObj["appearance"] !== "selected"){
  //   let newNodeObj = {...nodeObj}
  //   newNodeObj["appearance"] = "selected";
  //   newAllUpdates[nodeId] = newNodeObj;
  //     //if open folder and isn't already selected then select the folder's children
  //     if (nodeObj.isOpen){
  //       for (let nodeChildId of nodeObj.childNodeIds){
  //         selectVisibleTree({allSelected,loadedNodeObj,nodeId:nodeChildId,newAllUpdates})
  //       }
  //     }
  //   }
}

function visibleChildNodeIds({loadedNodeObj,nodeId,newAllUpdates,previousNodeIds=[]}){
  previousNodeIds.unshift(nodeId)
  const nodeObj = (newAllUpdates[nodeId]) ? newAllUpdates[nodeId] : loadedNodeObj[nodeId];
  if (nodeObj.isOpen){
    for (let nodeChildId of nodeObj.childNodeIds){
    visibleChildNodeIds({loadedNodeObj,nodeId:nodeChildId,newAllUpdates,previousNodeIds})
    }
  }
  return previousNodeIds;
}

function deselectVisibleTree({allSelected,loadedNodeObj,nodeId,newAllUpdates,startWithChildren=false}){
  console.log(">>>deselect nodeId",nodeId,"allSelected",allSelected)
  // if (!startWithChildren) {allSelected.push(nodeId);} //need to think about this
  const nodeObj = (newAllUpdates[nodeId]) ? newAllUpdates[nodeId] : loadedNodeObj[nodeId];
    // if (startWithChildren || nodeObj["appearance"] !== "selected"){
    if (nodeObj["appearance"] === "selected"){
      allSelected.splice(allSelected.indexOf(nodeId),1); //delete nodeId from allSelected
      let newNodeObj = {...nodeObj}
      newNodeObj["appearance"] = "default";
      newAllUpdates[nodeId] = newNodeObj;
        //if open folder and isn't already selected then select the folder's children
        if (nodeObj.isOpen){
          for (let nodeChildId of nodeObj.childNodeIds){
            deselectVisibleTree({allSelected,loadedNodeObj,nodeId:nodeChildId,newAllUpdates})
          }
        }
    }
  }

function getNodeObj({id, stateList=[]}) {
  for (let stateObj of stateList) {
    if (stateObj[id]) {
      return { ...stateObj[id]};
    }
  }
  return null;
}

function reducer(state, action) {
  console.log("----------REDUCER type:", action.type, "transferPayload:", action.payload)
    let loadedNodeObj = {};
    if (action.payload){
      loadedNodeObj = action.payload.loadedNodeObj;
    }
  const draggedShadowId = "draggedshadow";

  switch (action.type) {
    case 'CLEARALLSELECTED':{
      let newAllUpdates = {...state.allUpdates}
      for (let nodeId of state.allSelected){
        const nodeObj = (state.allUpdates[nodeId]) ? state.allUpdates[nodeId] : loadedNodeObj[nodeId];
        let newNodeObj = {...nodeObj};
        newNodeObj.appearance = "default";
        newAllUpdates[nodeId] = newNodeObj;
      }
      return {...state,allSelected:[],allUpdates:newAllUpdates}
    }
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


      return { ...state, allUpdates:newAllUpdates,allSelected:newAllSelected };
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
        //If clicked node isn't selected
        //then Deselect all selected nodes 
        //and select clicked node's tree which wasn't selected
        const nodeObj = (state.allUpdates[action.payload.nodeId]) ? state.allUpdates[action.payload.nodeId] : loadedNodeObj[action.payload.nodeId];
        
        if (nodeObj.appearance !== "selected"){
          newAllSelected = [];
        
          for (let selectedNodeId of state.allSelected){
            const nodeObj = (state.allUpdates[selectedNodeId]) ? state.allUpdates[selectedNodeId] : loadedNodeObj[selectedNodeId];
            let selectedNodeObj = {...nodeObj}
            selectedNodeObj["appearance"] = "default";
            newAllUpdates[selectedNodeId] = selectedNodeObj;
          }
          
          //select all visible downstream in the tree 
            selectVisibleTree({allSelected:newAllSelected,loadedNodeObj,nodeId:action.payload.nodeId,newAllUpdates})
        }

      
      } else if (metakey && !shiftKey) {
        //Control so add this tree to the selection
        if (action.payload.nodeObj.appearance === "selected"){
          //If parent is selected then don't deselect visible tree
          const nodeObj = (state.allUpdates[action.payload.nodeId]) ? state.allUpdates[action.payload.nodeId] : loadedNodeObj[action.payload.nodeId];
          const parentNodeObj = (state.allUpdates[nodeObj.parentId]) ? state.allUpdates[nodeObj.parentId] : loadedNodeObj[nodeObj.parentId];
          if (parentNodeObj.appearance === undefined || parentNodeObj.appearance !== "selected"){
            //Deselect tree 
            deselectVisibleTree({allSelected:newAllSelected,loadedNodeObj,nodeId:action.payload.nodeId,newAllUpdates})
          }
        
        }else{
          //Select Node and all visible children 
          selectVisibleTree({allSelected:newAllSelected,loadedNodeObj,nodeId:action.payload.nodeId,newAllUpdates})
        }
      
      } else if (!metakey && shiftKey) {
        //Shift is down so add selection to the range of items
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
      let newAllSelected = [...state.allSelected]
        if (nodeParentId === undefined) { nodeParentId = 'root'; } //No selections add to root
      let newNodeParent = {...(newAllUpdates[nodeParentId]) ? newAllUpdates[nodeParentId] : loadedNodeObj[nodeParentId]};


      for (let nodeObj of action.payload.nodes) {
        let nodeId = Object.keys(nodeObj)[0]; //There is only one key
        newNodeParent.childNodeIds.push(nodeId)
        nodeObj[nodeId]["parentId"] = nodeParentId;
        //if parent is selected, select node
        if (newNodeParent.appearance === "selected"){
          nodeObj[nodeId]["appearance"] = "selected";
          newAllSelected.unshift(nodeId)
        }
        newAllUpdates[nodeId] = {...nodeObj[nodeId]};
      }
      newAllUpdates[nodeParentId] = newNodeParent;
      let nodeIdsArr = [];
      return { ...state,nodeIdsArr,allUpdates:newAllUpdates,allSelected:newAllSelected}
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
      const draggedItemIds = action.payload.draggedItemIds;
      const newDragState = { ...state.dragState }

      // set previousParent to last item in selected
      const lastSelectedId = draggedItemIds[draggedItemIds.length - 1];
      const lastSelectedObj = getNodeObj({id:lastSelectedId, stateList:[newDragState, state.allUpdates, loadedNodeObj]})

      const draggedItemData = {
        previousParentId: lastSelectedObj.parentId,
        sourceParentId: lastSelectedObj.parentId,
        draggedItemIds: new Set(draggedItemIds)
      }
      
      for (let id of draggedItemIds) {
        const draggedNode = getNodeObj({id:id, stateList:[newDragState, state.allUpdates, loadedNodeObj]})
        draggedNode.appearance = "dragged";
        newDragState[id] = draggedNode;
      }      

      return { ...state, draggedItemData: draggedItemData, dragState: newDragState }
    }
    case 'DRAGOVER': { 
      const { previousParentId } = { ...state.draggedItemData };
      const dropTargetId = action.payload.dropTargetId;
      
      const updatedDraggedItemData = { ...state.draggedItemData };
      const newDragState = { ...state.dragState }
      const previousParentNode = getNodeObj({id:previousParentId, stateList:[newDragState, state.allUpdates, loadedNodeObj]})
      let previousList = [...previousParentNode.childNodeIds];
      
      const tokenizedId = dropTargetId.split("-");
      const dropTargetNode = getNodeObj({id:dropTargetId, stateList:[newDragState, state.allUpdates, loadedNodeObj]})
      const dropTargetParentId = dropTargetNode && tokenizedId[0] != "EMPTY" ? dropTargetNode.parentId : tokenizedId[1];
      const dropTargetParentNode = getNodeObj({id:dropTargetParentId, stateList:[newDragState, state.allUpdates, loadedNodeObj]})
      
      const isDraggedOverSelf = state.draggedItemData.draggedItemIds.has(dropTargetId);
      const isDraggedOverShadow = dropTargetId == draggedShadowId;
      const isDraggedOverChild = state.draggedItemData.draggedItemIds.has(dropTargetParentId);

      // if the item is dragged over itself or any children, remove any shadow then return
      if (isDraggedOverSelf || isDraggedOverShadow || isDraggedOverChild) {
        if (isDraggedOverSelf && newDragState[draggedShadowId]) {
          previousList = previousList.filter(itemId => itemId != draggedShadowId);
          previousParentNode.childNodeIds = previousList;
          newDragState[previousParentId] = previousParentNode;
          delete newDragState[draggedShadowId];
        }
        return { ...state, dragState: newDragState };
      }

      let dropTargetParentChildList = [...dropTargetParentNode.childNodeIds];      

      // if dragged into another parent / initial drag
      if (previousParentId !== dropTargetParentId || !newDragState[draggedShadowId]) {
        // remove item from previous list
        previousList = previousList.filter(itemId => itemId != draggedShadowId);
        previousParentNode.childNodeIds = previousList;
        newDragState[previousParentId] = previousParentNode;

        // add new shadow
        const draggedShadowNodeObj = {
          label: "SHADOW",
          childNodeIds: [],
          isOpen: false,
          appearance: "dropperview",
          parentId: dropTargetParentId,
        }
        updatedDraggedItemData.previousParentId = dropTargetParentId;
        newDragState[draggedShadowId] = draggedShadowNodeObj;
      }

      // add the shadow after the dragged over item
      const dropTargetIndex = dropTargetParentChildList.findIndex(itemId => itemId == dropTargetId);
      dropTargetParentChildList = dropTargetParentChildList.filter(itemId => itemId != draggedShadowId);
      dropTargetParentChildList.splice(dropTargetIndex, 0, draggedShadowId);

      dropTargetParentNode.childNodeIds = dropTargetParentChildList;
      newDragState[dropTargetParentId] = dropTargetParentNode;

      return { ...state, draggedItemData: updatedDraggedItemData, dragState: newDragState }
    }
    case 'DROPLEAVE': {      

      return { ...state }
    }
    case 'DROP': { 
      const { draggedItemIds, previousParentId } = { ...state.draggedItemData };
      const newDragState = { ...state.dragState }
      const newAllUpdates = { ...state.allUpdates }

      // item moved out of original parent or order changed
      if (newDragState[draggedShadowId]) {
        // remove draggedItems from their parents
        for (let draggedItemId of draggedItemIds) {
          const draggedItemNodeObj = getNodeObj({id:draggedItemId, stateList:[newAllUpdates, loadedNodeObj]})
          const draggedItemParentId = draggedItemNodeObj.parentId;
          const draggedItemParentNodeObj = getNodeObj({id:draggedItemParentId, stateList:[newAllUpdates, loadedNodeObj]})
          let parentList = [...draggedItemParentNodeObj.childNodeIds];
          parentList = parentList.filter(itemId => itemId != draggedItemId);
          draggedItemParentNodeObj.childNodeIds = parentList;
          newAllUpdates[draggedItemParentId] = draggedItemParentNodeObj;
        }
        
        const shadowIndex = newDragState[previousParentId].childNodeIds.findIndex(itemId => itemId == draggedShadowId);
        let previousParentNode = getNodeObj({id:previousParentId, stateList:[newAllUpdates, loadedNodeObj]})
        let previousList = [...previousParentNode.childNodeIds];
        for (let draggedItemId of draggedItemIds) {
          const draggedItemNodeObj = getNodeObj({id:draggedItemId, stateList:[newAllUpdates, loadedNodeObj]})

          // move draggedItems into previousParentId
          if (shadowIndex > -1) {
            previousList.splice(shadowIndex, 0, draggedItemId)
          }
          console.log("Here", previousList, shadowIndex, draggedItemId, previousParentId)
          previousParentNode.childNodeIds = previousList;
          draggedItemNodeObj.parentId = previousParentId;
          newAllUpdates[draggedItemId] = draggedItemNodeObj;
          newAllUpdates[previousParentId] = previousParentNode;
        }             
      }      

      return { ...state, dragState: newDragState, allUpdates: newAllUpdates, validDrop: true };
    }
    case 'DRAGEND': { 
      const newAllUpdates = { ...state.allUpdates }
   
      // set all dragged item style to default
      for (let draggedItemId of state.draggedItemData.draggedItemIds) {
        const draggedNode = { ...newAllUpdates[draggedItemId] ? newAllUpdates[draggedItemId] : loadedNodeObj[draggedItemId]};
        draggedNode.appearance = "default";
        newAllUpdates[draggedItemId] = draggedNode;
      }      

      if (state.dragState[draggedShadowId]) {
        // cleanup shadow
        const { previousParentId } = state.draggedItemData;
        const previousParentNode = getNodeObj({id:previousParentId, stateList:[newAllUpdates, loadedNodeObj]})
        let previousList = previousParentNode.childNodeIds.filter(itemId => itemId != draggedShadowId);
        previousParentNode.childNodeIds = previousList;
        newAllUpdates[previousParentId] = previousParentNode;
      }
      console.log("Here", state.dragState, newAllUpdates)

      return { ...state, draggedItemData: null, allUpdates: newAllUpdates, dragState: {}, validDrop: false, allSelected: [] }
    }
    default:
      throw new Error(`Unhandled type in reducer ${action, action.type}`);
  }
}

//appearance 'default','selected','inactive','dropperview'
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
  const deleteNode = <button 
  onMouseDown={e=>{ e.preventDefault(); }}
  data-doenet-browserid={props.browserId}
  tabIndex={-1}
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    props.transferDispatch('DELETENODES', { nodeId: props.nodeId, nodeObj: props.nodeObj })
    // props.actions().toggleFolder(props.nodeId,props.nodeObj);
  }}>X</button>
  const toggleLabel = (props.nodeObj.isOpen) ? "Close" : "Open";
  const toggle = <button 
  onMouseDown={e=>{ e.preventDefault(); }}
  data-doenet-browserid={props.browserId}
  tabIndex={-1}
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    props.transferDispatch('TOGGLEFOLDER', { nodeId: props.nodeId, nodeObj: props.nodeObj })
    // props.actions().toggleFolder(props.nodeId,props.nodeObj);
  }}>{toggleLabel}</button>
  let bgcolor = "#e2e2e2";
  if (props.nodeObj.appearance === "selected") { bgcolor = "#6de5ff"; }
  if (props.nodeObj.appearance === "dropperview") { bgcolor = "#53ff47"; }
  if (props.nodeObj.appearance === "dragged") { bgcolor = "#f3ff35"; }  

  // let tabindex = 0;
  // if (props.nodeObj.appearance === "selected") { tabindex = -1 }
  return <div 
  data-doenet-browserid={props.browserId}
  tabIndex={-1} 
  onClick={(e) => {
    props.transferDispatch('CLICKITEM', { nodeId: props.nodeId, nodeObj: props.nodeObj, shiftKey: e.shiftKey, metaKey: e.metaKey })
  }} 

  onDoubleClick={(e) => {
    props.transferDispatch('TOGGLEFOLDER', { nodeId: props.nodeId, nodeObj: props.nodeObj })
  }} 
  // onFocus={(e)=>{
  //   console.log(">>>>>>>>>>>>>>")
  //   console.log(">>>>>>>>>>>>>>")
  //   console.log(">>>FOCUS",props.nodeId)
  //   console.log(">>>>>>>>>>>>>>")
  //   console.log(">>>>>>>>>>>>>>")
    
  //   props.transferDispatch('CLICKITEM', { nodeId: props.nodeId, nodeObj: props.nodeObj, shiftKey: e.shiftKey, metaKey: e.metaKey })

  // }}
 
  onBlur={(e) => {
    //DELETE THIS IF
    if (e.relatedTarget){
      console.log(">>>doenetBrowserid",e.relatedTarget.dataset.doenetBrowserid)
    }

    //Only clear if focus goes outside of this node group
     if (e.relatedTarget === null){
       props.setClearSelection(true);
     }else if(e.relatedTarget.dataset.doenetBrowserid !== props.browserId){
      props.setClearSelection(true);
    }
 
  }}
  style={{
    width: "300px",
    padding: "4px",
    border: "1px solid black",
    backgroundColor: bgcolor,
    margin: "2px"
  }} ><div 
  className="noselect" 
  style={{
    marginLeft: `${props.level * indentPx}px`
  }}>{toggle} [icon] {props.nodeObj.label} ({numChildren}){deleteNode}</div></div>
})
