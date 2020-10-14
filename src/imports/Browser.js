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
      'root': {childNodeIds:['rf1', 'rf2','rr1']},
      'rf1': {
        label: "root folder",
        childNodeIds: ['f1', 'f3', 'f4'],
        isOpen: true,
        appearance: "default",
        parentId: "root",
        type: "folder",
      },
      'rf2': {
        label: "root folder 2",
        childNodeIds: ['f5'],
        isOpen: true,
        appearance: "default",
        parentId: "root",
        type: "folder",
      },
      'rr1': {
        label: "root repo 1",
        childNodeIds: ['a1','a2'],
        isOpen: true,
        appearance: "default",
        parentId: "root",
        type: "repo",
      },
      'f1': {
        label: "folder one",
        childNodeIds: ['f2'],
        isOpen: true,
        appearance: "default",
        parentId: "rf1",
        type: "folder",
      },
      'f2': {
        label: "folder two",
        childNodeIds: [],
        isOpen: false,
        appearance: "default",
        parentId: "f1",
        type: "folder",
      },
      'f3': {
        label: "folder three",
        childNodeIds: [],
        isOpen: false,
        appearance: "default",
        parentId: "rf1",
        type: "folder",
      },
      'f4': {
        label: "folder four",
        childNodeIds: [],
        isOpen: false, 
        appearance: "default",
        parentId: "rf1",
        type: "folder",
      },
      'f5': {
        label: "folder 5",
        childNodeIds: ['u1','u2','u3','d1','d2'],
        isOpen: false, 
        appearance: "default",
        parentId: "rf2",
        type: "folder",
      },
      'u1': {
        label: "Doenet URL",
        appearance: "default",
        parentId: "f5",
        type: "url",
        url: "http://doenet.org",
      },
      'u2': {
        label: "Google URL",
        appearance: "default",
        parentId: "f5",
        type: "url",
        url: "http://www.google.com",
      },
      'u3': {
        label: "Yahoo URL",
        appearance: "default",
        parentId: "f5",
        type: "url",
        url: "http://www.yahoo.com",
      },
      'a1': {
        label: "Assignment 1",
        appearance: "default",
        parentId: "f5",
        type: "assignment",
        assignmentId: "a1assignmentId",
        contentId: "a1contentId",
        branchId: "a1branchId",
      },
      'a2': {
        label: "Assignment 2",
        appearance: "default",
        parentId: "f5",
        type: "assignment",
        assignmentId: "a2assignmentId",
        contentId: "a2contentId",
        branchId: "a2branchId",
      },
      'd1': {
        label: "Pendulum",
        appearance: "default",
        parentId: "f5",
        type: "doenetML",
        contentId: "d1contentId",
        branchId: "d1branchId",
      },
      'd2': {
        label: "1+1 is?",
        appearance: "default",
        parentId: "f5",
        type: "doenetML",
        contentId: "d2contentId",
        branchId: "d2branchId",
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
    nodeObjCache: {}
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

  //---- No useState beyond this line ----
  //Save processing and time by waiting for browserId to be defined
  if (browserId === ""){
    return null;
  }

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
      const dragItemObj = { ...state.allUpdates[id] ? state.allUpdates[id] : loadedNodeObj[id] };
      if (dragItemObj.isOpen) {
        // close dragItem if open
        transferDispatch('TOGGLEFOLDER', { nodeId: id, nodeObj: dragItemObj })
      }      
      transferDispatch("DRAGSTART", { dragItemId: id });
    } 
    
    const onDragOver = (ev, id) => {
      console.log("dispatch dragged over event: ", id)
      const dropTargetObj = { ...state.allUpdates[id] ? state.allUpdates[id] : loadedNodeObj[id] };
      const isDraggedOverSelf = state.draggedItemData.id == id;
      if (!dropTargetObj.isOpen && !isDraggedOverSelf) {
        transferDispatch('TOGGLEFOLDER', { nodeId: id, nodeObj: dropTargetObj })
      }      
      transferDispatch("DRAGOVER", {dropTargetId: id, ev: ev});
    }

    const onDragEnd = () => {
      console.log("dispatch dragEnd event: ", id)
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
  
  const latestRootFolders = ((state.allUpdates['root']) ? state.allUpdates['root'] : loadedNodeObj['root']).childNodeIds;
  buildNodeArray(latestRootFolders);

  function buildNodeArray(folderArr, level = 0, parent = "") {
    let numInParent = 0;
    for (let [i, id] of folderArr.entries()) {
      const nodeObjI = (state.allUpdates[id]) ? state.allUpdates[id] : loadedNodeObj[id];
      //Implementation of folders only flag
      if (props.foldersOnly && nodeObjI.type !== "folder" && nodeObjI.type !== "repo" ){
        continue;
      } 
      numInParent++;
      let numChildren = countChildren(nodeObjI);

    
      const nodeItem = <Node 
      key={`node${level}-${i}${parent}`} 
      level={level} 
      nodeObj={nodeObjI} 
      nodeId={id} 
      browserId={browserId} 
      transferDispatch={transferDispatch} 
      setClearSelection={setClearSelection} 
      foldersOnly={props.foldersOnly}
      numChildren={numChildren}
      />;
      const draggableAndDroppableNodeItem = createDnDItem(id, nodeItem);
      nodes.push(draggableAndDroppableNodeItem);
      // nodes.push(nodeItem);
      if ((nodeObjI.type === "folder" || nodeObjI.type === "repo") && nodeObjI.isOpen) {
        buildNodeArray(nodeObjI.childNodeIds, level + 1, `${parent}-${i}`)
      }
    }
    //Add empty node if open folder is empty
    if (numInParent < 1) {
      nodes.push(<Node key={`node${level}-0${parent}`} level={level} empty={true} />)
    }
    
  }

  function countChildren(nodeObj){
    let numChildren = 0;
    if (nodeObj && nodeObj.childNodeIds && nodeObj.childNodeIds.length > 0){

      if (props.foldersOnly){
        for (let nodeId of nodeObj.childNodeIds){
        const childNodeObj = (state.allUpdates[nodeId]) ? state.allUpdates[nodeId] : loadedNodeObj[nodeId];
          if (childNodeObj.type === "folder" || childNodeObj.type === "repo"){
            numChildren++;
          }
        }
      }else{
        numChildren = nodeObj.childNodeIds.length;
      }

    }
    return numChildren;
  }


  return <>
  
    <button 
    data-doenet-browserid={browserId}
    tabIndex={-1}
    onMouseDown={e=>{ e.preventDefault(); }}
    onClick={()=>{
      let node = {
        label: "Untitled folder",
        childNodeIds: [],
        isOpen: false,
        appearance: "default",
        type: "folder",
      }
      let nodeObj = {};
      let Id = nanoid();
      nodeObj[Id] = node;
    dispatch({ type: "ADDNODES",payload:{loadedNodeObj,nodes:[nodeObj]}})
      }}>Add Folder</button>
       <button 
    data-doenet-browserid={browserId}
    tabIndex={-1}
    onMouseDown={e=>{ e.preventDefault(); }}
    onClick={()=>{
      let node = {
        label: "Untitled URL",
        appearance: "default",
        type: "url",
        url: "http://doenet.org",
      }
      let nodeObj = {};
      let Id = nanoid();
      nodeObj[Id] = node;
    dispatch({ type: "ADDNODES",payload:{loadedNodeObj,nodes:[nodeObj]}})
      }}>Add URL</button>
    {nodes}
  </>
}

function buildNodeIdArray({loadedNodeObj={},folderArr=[],nodeIds=[],allUpdates={}}){
  for (let id of folderArr) {
    const nodeObj = (allUpdates[id]) ? allUpdates[id] : loadedNodeObj[id];
      nodeIds.push(id);
      if ((nodeObj.type === "folder" || nodeObj.type === "repo") && nodeObj.isOpen) { buildNodeIdArray({loadedNodeObj,folderArr:nodeObj.childNodeIds,nodeIds,allUpdates}); }
  }
  return nodeIds;
}

function removeTreeNodeIdsFromAllSelected({allSelected,loadedNodeObj,allUpdates,nodeId}){
  allSelected.splice(allSelected.indexOf(nodeId),1)
  const nodeObj = (allUpdates[nodeId]) ? allUpdates[nodeId] : loadedNodeObj[nodeId];
  if (nodeObj.type === "folder"){
    for (let nodeChildId of nodeObj.childNodeIds){
      removeTreeNodeIdsFromAllSelected({allSelected,loadedNodeObj,allUpdates,nodeId:nodeChildId})
    }
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
  if ((nodeObj.type === "folder" || nodeObj.type === "repo") && nodeObj.isOpen){
    for (let nodeChildId of nodeObj.childNodeIds){
    visibleChildNodeIds({loadedNodeObj,nodeId:nodeChildId,newAllUpdates,previousNodeIds})
    }
  }
  return previousNodeIds;
}

function deselectVisibleTree({allSelected,loadedNodeObj,nodeId,newAllUpdates,startWithChildren=false}){
  // if (!startWithChildren) {allSelected.push(nodeId);} //need to think about this
  const nodeObj = (newAllUpdates[nodeId]) ? newAllUpdates[nodeId] : loadedNodeObj[nodeId];
    // if (startWithChildren || nodeObj["appearance"] !== "selected"){
    if (nodeObj["appearance"] === "selected"){
      allSelected.splice(allSelected.indexOf(nodeId),1); //delete nodeId from allSelected
      let newNodeObj = {...nodeObj}
      newNodeObj["appearance"] = "default";
      newAllUpdates[nodeId] = newNodeObj;
        //if open folder and isn't already selected then select the folder's children
        if ((nodeObj.type === "folder" || nodeObj.type === "repo") && nodeObj.isOpen){
          for (let nodeChildId of nodeObj.childNodeIds){
            deselectVisibleTree({allSelected,loadedNodeObj,nodeId:nodeChildId,newAllUpdates})
          }
        }
    }
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
      let newNodeParentId = state.allSelected[state.allSelected.length - 1];
      let newAllSelected = [...state.allSelected]
      let nodeType;
      if (newNodeParentId){
        nodeType = loadedNodeObj[newNodeParentId].type;
      }
      //No folder/repo selection as latest so add to root
      if (newNodeParentId === undefined || (nodeType !== 'folder' && nodeType !== 'repo')) { newNodeParentId = 'root'; } 

      let newNodeParent = {...(newAllUpdates[newNodeParentId]) ? newAllUpdates[newNodeParentId] : loadedNodeObj[newNodeParentId]};


      for (let nodeObj of action.payload.nodes) {
        let nodeId = Object.keys(nodeObj)[0]; //There is only one key
        newNodeParent.childNodeIds.push(nodeId)
        nodeObj[nodeId]["parentId"] = newNodeParentId;
        //if parent is selected, select node
        if (newNodeParent.appearance === "selected"){
          nodeObj[nodeId]["appearance"] = "selected";
          newAllSelected.unshift(nodeId)
        }
        newAllUpdates[nodeId] = {...nodeObj[nodeId]};
      }
      newAllUpdates[newNodeParentId] = newNodeParent;
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
    case 'DRAGOVER': { 
      const { previousParentId } = { ...state.draggedItemData };
      const dropTargetId = action.payload.dropTargetId;
      
      const updatedDraggedItemData = { ...state.draggedItemData };
      const newAllUpdates = { ...state.allUpdates }
      const previousParentNode = { ...newAllUpdates[previousParentId] ? newAllUpdates[previousParentId] : loadedNodeObj[previousParentId]};
      let previousList = [...previousParentNode.childNodeIds];
      const dropTargetNode = { ...newAllUpdates[dropTargetId] ? newAllUpdates[dropTargetId] : loadedNodeObj[dropTargetId]};
      const dropTargetParentNode = { ...newAllUpdates[dropTargetNode.parentId] ? newAllUpdates[dropTargetNode.parentId] : loadedNodeObj[dropTargetNode.parentId]};

      const isDraggedOverSelf = state.draggedItemData.id == dropTargetId || dropTargetId == draggedShadowId;
      const isDraggedOverChild = dropTargetNode.parentId == state.draggedItemData.id;

      // if the item is dragged over itself or any children, remove any shadow then return
      if (isDraggedOverSelf || isDraggedOverChild) {
        if (state.draggedItemData.id == dropTargetId && newAllUpdates[draggedShadowId]) {
          const indexInList = previousList.findIndex(itemId => itemId == draggedShadowId);
          if (indexInList > -1) {
            previousList.splice(indexInList, 1);
          }       
          previousParentNode.childNodeIds = previousList;
          newAllUpdates[previousParentId] = previousParentNode;
          delete newAllUpdates[draggedShadowId];
        }
        return { ...state, allUpdates: newAllUpdates };
      }

      let dropTargetParentChildList = [...dropTargetParentNode.childNodeIds];      

      // if dragged into another parent / initial drag
      if (previousParentId !== dropTargetNode.parentId || !newAllUpdates[draggedShadowId]) {
        // remove item from previous list
        const indexInList = previousList.findIndex(itemId => itemId == draggedShadowId);
        if (indexInList > -1) {
          previousList.splice(indexInList, 1);
        }       
        previousParentNode.childNodeIds = previousList;
        newAllUpdates[previousParentId] = previousParentNode;

        // add new shadow
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
      
      return { ...state, draggedItemData: updatedDraggedItemData, allUpdates: newAllUpdates }
    }
    case 'DROPLEAVE': {      

      return { ...state }
    }
    case 'DROP': { 
      const { id, previousParentId, sourceParentId } = { ...state.draggedItemData };

      const newAllUpdates = { ...state.allUpdates }

      // item moved out of original parent or order changed
      if (newAllUpdates[draggedShadowId]) {
        // remove draggedItem from sourceParentId
        const sourceParentNode = { ...newAllUpdates[sourceParentId] ? newAllUpdates[sourceParentId] : loadedNodeObj[sourceParentId]};
        let sourceParentList = [...sourceParentNode.childNodeIds];
        indexInList = sourceParentList.findIndex(itemId => itemId == id);
        if (indexInList > -1) {
          sourceParentList.splice(indexInList, 1);
        }

        newAllUpdates[sourceParentId].childNodeIds = sourceParentList;
      }
      
      // move draggedItemData.id into previousParentId
      const previousParentNode = { ...newAllUpdates[previousParentId] ? newAllUpdates[previousParentId] : loadedNodeObj[previousParentId]};
      let previousList = [...previousParentNode.childNodeIds];
      
      // replace shadow in previousParentId with draggedItem
      let indexInList = previousList.findIndex(itemId => itemId == draggedShadowId);
      if (indexInList > -1) {
        previousList[indexInList] = id;
      }

      previousParentNode.childNodeIds = previousList;
      newAllUpdates[id].parentId = previousParentId;
      newAllUpdates[previousParentId] = previousParentNode;

      return { ...state, allUpdates: newAllUpdates, validDrop: true };
    }
    case 'DRAGEND': { 
      const newAllUpdates = { ...state.allUpdates }
      
      const draggedNode = { ...newAllUpdates[state.draggedItemData.id] ? newAllUpdates[state.draggedItemData.id] : loadedNodeObj[state.draggedItemData.id]};
      draggedNode.appearance = "default";
      newAllUpdates[state.draggedItemData.id] = draggedNode;

      if (newAllUpdates[draggedShadowId]) {
        // cleanup shadow
        // move draggedItemData.id into previousParentId
        const { previousParentId } = state.draggedItemData;
        const previousParentNode = { ...newAllUpdates[previousParentId] ? newAllUpdates[previousParentId] : loadedNodeObj[previousParentId]};
        let previousList = [...previousParentNode.childNodeIds];
        
        // replace shadow in previousParentId with draggedItem
        let indexInList = previousList.findIndex(itemId => itemId == draggedShadowId);
        if (indexInList > -1) {
          previousList.splice(indexInList, 1);
        }
        previousParentNode.childNodeIds = previousList;
        newAllUpdates[previousParentId] = previousParentNode;

        delete newAllUpdates[draggedShadowId];
      }

      return { ...state, draggedItemData: null, allUpdates: newAllUpdates, validDrop: false }
    }
    default:
      throw new Error(`Unhandled type in reducer ${action, action.type}`);
  }
}

//appearance 'default','selected','inactive','dropperview'
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

 


  let bgcolor = "#e2e2e2";
  if (props.nodeObj.appearance === "selected") { bgcolor = "#6de5ff"; }
  if (props.nodeObj.appearance === "dropperview") { bgcolor = "#53ff47"; }
  if (props.nodeObj.appearance === "dragged") { bgcolor = "#f3ff35"; }  




  if (props.nodeObj.type === "folder"){
    //**** FOLDER *****
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

    return <div 
    data-doenet-browserid={props.browserId}
    tabIndex={-1} 
    onClick={(e) => {
      props.transferDispatch('CLICKITEM', { nodeId: props.nodeId, nodeObj: props.nodeObj, shiftKey: e.shiftKey, metaKey: e.metaKey })
    }} 
  
    onDoubleClick={(e) => {
      props.transferDispatch('TOGGLEFOLDER', { nodeId: props.nodeId, nodeObj: props.nodeObj })
    }} 
  
   
    onBlur={(e) => {
  
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
    }}>{toggle} [FOLDER] {props.nodeObj.label} ({props.numChildren}){deleteNode}</div></div>
  }else if (props.nodeObj.type === "repo"){
    //**** REPO *****

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

    return <div 
    data-doenet-browserid={props.browserId}
    tabIndex={-1} 
    onClick={(e) => {
      props.transferDispatch('CLICKITEM', { nodeId: props.nodeId, nodeObj: props.nodeObj, shiftKey: e.shiftKey, metaKey: e.metaKey })
    }} 
  
    onDoubleClick={(e) => {
      props.transferDispatch('TOGGLEFOLDER', { nodeId: props.nodeId, nodeObj: props.nodeObj })
    }} 
  
   
    onBlur={(e) => {
  
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
    }}>{toggle} [REPO] {props.nodeObj.label} ({props.numChildren}){deleteNode}</div></div>
  }else if (props.nodeObj.type === "url"){
    //*****URL*****
    return <div 
    data-doenet-browserid={props.browserId}
    tabIndex={-1} 
    onClick={(e) => {
      props.transferDispatch('CLICKITEM', { nodeId: props.nodeId, nodeObj: props.nodeObj, shiftKey: e.shiftKey, metaKey: e.metaKey })
    }} 
  
    onBlur={(e) => {
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
      marginLeft: `${props.level * indentPx + 34}px`
    }}>[URL] {props.nodeObj.label} {deleteNode}</div></div>
  }else if (props.nodeObj.type === "doenetML"){
    //***** doenetML *****
    return <div 
    data-doenet-browserid={props.browserId}
    tabIndex={-1} 
    onClick={(e) => {
      props.transferDispatch('CLICKITEM', { nodeId: props.nodeId, nodeObj: props.nodeObj, shiftKey: e.shiftKey, metaKey: e.metaKey })
    }} 
  
    onBlur={(e) => {
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
      marginLeft: `${props.level * indentPx + 34}px`
    }}>[doenetML] {props.nodeObj.label} {deleteNode}</div></div>
  }else if (props.nodeObj.type === "assignment"){
    //***** assignment *****
    return <div 
    data-doenet-browserid={props.browserId}
    tabIndex={-1} 
    onClick={(e) => {
      props.transferDispatch('CLICKITEM', { nodeId: props.nodeId, nodeObj: props.nodeObj, shiftKey: e.shiftKey, metaKey: e.metaKey })
    }} 
  
    onBlur={(e) => {
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
      marginLeft: `${props.level * indentPx + 34}px`
    }}>[assignment] {props.nodeObj.label} {deleteNode}</div></div>
  }
  
})
