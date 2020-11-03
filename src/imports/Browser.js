import React, { useState, useMemo, useCallback, useReducer, useEffect, useRef } from 'react';
import '../Tools/util.css';
import nanoid from 'nanoid';
import WithDropTarget from "./dropTarget";
import WithDragItem from "./dragItem";
import {
  HashRouter as Router,
  useHistory,
  useParams
} from "react-router-dom";

export default function Browser(props) {
  const [browserId,setBrowserId] = useState("");
  const [prevPath,setPrevPath] = useState("");
  let history = useHistory();
  useEffect(()=>{
    const browserid = nanoid();
    setBrowserId(browserid);
  },[]);
  console.log("=======START OF BROWSER",browserId,"props",props,"prevPath",prevPath)

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
        parentId: "rr1",
        type: "assignment",
        assignmentId: "a1assignmentId",
        contentId: "a1contentId",
        branchId: "a1branchId",
      },
      'a2': {
        label: "Assignment 2",
        appearance: "default",
        parentId: "rr1",
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
    dragState: {}
  }
  const [state, dispatch] = useReducer(reducer, initialState);
  console.log("\n###BASESTATE", state,"allSelected",state.allSelected)
  if (clearSelection){
    // if (props.route){
    //   history.push("/")
    // }
    //Update blurNum
    if (!props.alwaysSelected){
      dispatch({ type: "CLEARALLSELECTED" })
    }
    setClearSelection(false);
  }
  if (props.route && props.route.location.pathname !== prevPath && props.route.location.pathname !== "/"){
    dispatch({type: "ROUTEPATH", payload: {path:props.route.location.pathname,browserId,loadedNodeObj}})
    setPrevPath(props.route.location.pathname);
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

  const createDropTarget = (browserId, id, element) => {
    const onDrop = () => {
      transferDispatch("DROP", {dropTargetId: id});
    }

    return (
      <WithDropTarget id={id} key={`droptarget-${id}`} onDrop={onDrop}>
        { element }
      </WithDropTarget>
    )
  }

  const createDragItem = (browserId, id, element) => {
    const onDragStart = (ev, id) => {
      let draggedItemIds = new Set(state.allSelected);

      if (draggedItemIds.has(id)) {
        // if current dragged item selected
        // remove items at lower hierarchy in selected items
        let processQueue = [ ...state.allSelected ];
        while (processQueue.length != 0) {
          const currentNodeObjId = processQueue.pop();
          const currentNodeObj = getNodeObj({id:currentNodeObjId, stateList:[state.dragState, state.allUpdates, loadedNodeObj]});
          if (!currentNodeObj.childNodeIds) continue;
          for (let childNodeObjId of currentNodeObj.childNodeIds) {
            if (draggedItemIds.has(childNodeObjId)) {
              draggedItemIds.delete(childNodeObjId);
              processQueue = processQueue.filter(id => id == childNodeObjId);
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
      
      transferDispatch("DRAGSTART", { draggedItemIds: draggedItemIds, ev: ev, browserId: browserId });
    } 
    
    const onDragOver = (ev, id) => {
      transferDispatch("DRAGOVER", {dropTargetId: id, ev: ev});
    }

    const onDragEnd = () => {
      transferDispatch("DRAGEND", {browserId: browserId });
    }

    return (
      <WithDragItem id={id} key={`dragitem-${id}`} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} >
        { element }
      </WithDragItem>
    )
  }

  const createDnDItem = (browserId, id, element) => {
    const draggableNodeItem = createDragItem(browserId, id, element);
    const draggableAndDroppableNodeItem = createDropTarget(browserId, id, draggableNodeItem);
    return draggableAndDroppableNodeItem;
  }

  let nodes = [];  
  
  const latestRootFolders = getNodeObj({id:"root", stateList:[state.dragState, state.allUpdates, loadedNodeObj]}).childNodeIds;
  buildNodeArray(latestRootFolders);

  function buildNodeArray(folderArr, level = 0, parent = "", parentFolderId="root") {
    let numInParent = 0;
    for (let [i, id] of folderArr.entries()) {
      const nodeObjI = getNodeObj({id: id, stateList: [state.dragState, state.allUpdates, loadedNodeObj]});
      //Implementation of folders only flag
      if (props.foldersOnly && nodeObjI.type !== "folder" && nodeObjI.type !== "repo" ){
        continue;
      } 
      numInParent++;
      let numChildren = countChildren(nodeObjI);

      
      let route = false;
      if (props.route){ route = true}

      const nodeItem = <Node
      key={`node${level}-${i}${parent}`} 
      parentFolderId={parentFolderId}
      route={route}
      history={history}
      level={level} 
      nodeObj={nodeObjI} 
      nodeId={id} 
      browserId={browserId} 
      transferDispatch={transferDispatch} 
      setClearSelection={setClearSelection} 
      foldersOnly={props.foldersOnly}
      selectOnlyOne={props.selectOnlyOne}
      numChildren={numChildren}
      />;
      const draggableAndDroppableNodeItem = createDnDItem(browserId, id, nodeItem);
      nodes.push(draggableAndDroppableNodeItem);
      // nodes.push(nodeItem);
      if ((nodeObjI.type === "folder" || nodeObjI.type === "repo") && nodeObjI.isOpen) {
        buildNodeArray(nodeObjI.childNodeIds, level + 1, `${parent}-${i}`,id)
      }
    }
    //Add empty node if open folder is empty
    if (numInParent < 1) {
      const emptyNodeId = `EMPTY-${parentFolderId}`;
      const emptyNode = <Node key={`node${level}-0${parent}`} level={level} empty={true} />;
      nodes.push(createDnDItem(props.browserId, emptyNodeId, emptyNode));
    }
  }

  function countChildren(nodeObj){
    let numChildren = 0;
    if (nodeObj && nodeObj.childNodeIds && nodeObj.childNodeIds.length > 0){

      if (props.foldersOnly){
        for (let nodeId of nodeObj.childNodeIds){
        const childNodeObj = getNodeObj({id: nodeId, stateList:[state.dragState, state.allUpdates, loadedNodeObj]});
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

  function renderDragGhost() {

    const dragGhostId = `drag-ghost-${browserId}`;
    const numItems = state.mode == "DRAGGING" ? state.draggedItemData.draggedItemIds.size : 0;
    const innerNode = state.mode == "DRAGGING" && state.draggedItemData.draggedNodeElement ?
      state.draggedItemData.draggedNodeElement :
      <div>Test</div>;    
    
    return <DragGhost id={dragGhostId} numItems={numItems} element={innerNode} />;
  }


  return <>
  
    <button 
    data-doenet-browserid={browserId}
    tabIndex={0}
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
    dispatch({ type: "ADDNODES",payload:{loadedNodeObj,nodes:[nodeObj],selectOnlyOne:props.selectOnlyOne}})
      }}>Add Folder</button>
       <button 
    data-doenet-browserid={browserId}
    tabIndex={0}
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
    dispatch({ type: "ADDNODES",payload:{loadedNodeObj,nodes:[nodeObj],selectOnlyOne:props.selectOnlyOne}})
      }}>Add URL</button>
    <div>{nodes}</div>
    { renderDragGhost() }
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

function getNodeObj({id, stateList=[]}) {
  for (let stateObj of stateList) {
    if (stateObj[id]) {
      return { ...stateObj[id]};
    }
  }
  return null;
}

function openPathToFolderId({loadedNodeObj,newAllUpdates,nodeId}){
  const nodeObj = (newAllUpdates[nodeId]) ? newAllUpdates[nodeId] : loadedNodeObj[nodeId];
  if (nodeObj && !nodeObj.isOpen){
    let newNodeObj = {...nodeObj};
    newNodeObj.isOpen = true;
    newAllUpdates[nodeId] = newNodeObj;
  }
  if (nodeObj && nodeObj.parentId !== "root"){
    openPathToFolderId({loadedNodeObj,newAllUpdates,nodeId:nodeObj.parentId})
  }
}

function deselectAll({loadedNodeObj,newAllUpdates,newAllSelected}){
  for (let nodeId of newAllSelected){
    const nodeObj = (newAllUpdates[nodeId]) ? newAllUpdates[nodeId] : loadedNodeObj[nodeId];
    let newNodeObj = {...nodeObj};
    newNodeObj.appearance = "default";
    newAllUpdates[nodeId] = newNodeObj;
  }
  newAllUpdates = [];
}

function selectVisibleTree({allSelected,loadedNodeObj,nodeId,newAllUpdates,startWithChildren=false}){
  let visibleChildren = visibleChildNodeIds({loadedNodeObj,nodeId,newAllUpdates});
  console.log(">>>startWithChildren",startWithChildren,"visibleChildren",visibleChildren,"allSelected",allSelected)
  // if (!startWithChildren) {
  //   visibleChildren.shift();
  // } 
  for (let nodeId of visibleChildren){
    const nodeObj = (newAllUpdates[nodeId]) ? newAllUpdates[nodeId] : loadedNodeObj[nodeId];
    let newNodeObj = {...nodeObj}
    newNodeObj["appearance"] = "selected";
    newAllUpdates[nodeId] = newNodeObj;
    if (!allSelected.includes(nodeId)){ //Protect from duplicates
      allSelected.push(nodeId);
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
    case 'ROUTEPATH':{
      const pathParts = action.payload.path.split("/").filter(i=>i); //filter out ""
      if (pathParts.length === 0){
        return { ...state };
      }else{
        let newAllUpdates = { ...state.allUpdates };
        let newAllSelected = [...state.allSelected ];
        const [routeBrowserId,targetFolderId] = pathParts;
        //If came from another browser then open to path and select
        if (action.payload.browserId !== routeBrowserId){
          openPathToFolderId({loadedNodeObj,newAllUpdates,nodeId:targetFolderId});
          deselectAll({loadedNodeObj,newAllUpdates,newAllSelected})
          selectVisibleTree({allSelected:newAllSelected,loadedNodeObj,nodeId:targetFolderId,newAllUpdates})
        }
      return { ...state, allUpdates:newAllUpdates,allSelected:newAllSelected };
      // return { ...state, allUpdates:newAllUpdates,nodeIdsArr,allSelected:newAllSelected,mode };

      }

    }
    case 'CLEARALLSELECTED':{
      let newAllUpdates = {...state.allUpdates};
      let newAllSelected = [...state.allSelected];
      deselectAll({loadedNodeObj,newAllUpdates,newAllSelected})
      return {...state,allSelected:newAllSelected,allUpdates:newAllUpdates}
    }
    case 'TOGGLEFOLDER': {
      const selectOnlyOne = action.payload.selectOnlyOne;

      let newNodeObj = { ...action.payload.nodeObj }
      let newAllUpdates = { ...state.allUpdates };
      let newAllSelected = [...state.allSelected]
      newNodeObj["isOpen"] = !newNodeObj["isOpen"];      
      newAllUpdates[action.payload.nodeId] = newNodeObj;

      if (newNodeObj["isOpen"] && newNodeObj.appearance === 'selected' && !selectOnlyOne){
        //Opening a selected folder. Select all children
        selectVisibleTree({allSelected:newAllSelected,loadedNodeObj,nodeId:action.payload.nodeId,newAllUpdates,startWithChildren:true})
      }

      return { ...state, allUpdates:newAllUpdates,allSelected:newAllSelected };
    }
    case 'CLICKITEM': {
      const selectOnlyOne = action.payload.selectOnlyOne;
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

      if (selectOnlyOne) {
        const nodeObj = (state.allUpdates[action.payload.nodeId]) ? state.allUpdates[action.payload.nodeId] : loadedNodeObj[action.payload.nodeId];
        
        if (nodeObj.appearance !== "selected"){
          let nodeIdToSelect = action.payload.nodeId;
          newAllSelected = [nodeIdToSelect];
      
          //Deselect previously selected
          for (let selectedNodeId of state.allSelected){
            const nodeObj = (state.allUpdates[selectedNodeId]) ? state.allUpdates[selectedNodeId] : loadedNodeObj[selectedNodeId];
            let selectedNodeObj = {...nodeObj}
            selectedNodeObj["appearance"] = "default";
            newAllUpdates[selectedNodeId] = selectedNodeObj;
          }

          //Select Single Node
          newNodeObj.appearance = "selected";
          newAllUpdates[nodeIdToSelect] = newNodeObj;
        }
      } else if (!metakey && !shiftKey) {
        //No shift or control 
        //If clicked node isn't selected
        //then Deselect all selected nodes 
        //and select clicked node's tree which wasn't selected
        const nodeObj = (state.allUpdates[action.payload.nodeId]) ? state.allUpdates[action.payload.nodeId] : loadedNodeObj[action.payload.nodeId];
        
        if (nodeObj.appearance !== "selected"){
          newAllSelected = [];
        
          //Deselect previously selected
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
      const selectOnlyOne = action.payload.selectOnlyOne;

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
        if (newNodeParent.appearance === "selected" && !selectOnlyOne){
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
      const draggedItemIds = action.payload.draggedItemIds;
      const newDragState = { ...state.dragState }

      // set previousParent to last item in selected
      const lastSelectedId = draggedItemIds[draggedItemIds.length - 1];
      const lastSelectedObj = getNodeObj({id:lastSelectedId, stateList:[newDragState, state.allUpdates, loadedNodeObj]})
      const draggedItemData = {
        previousParentId: lastSelectedObj.parentId,
        sourceParentId: lastSelectedObj.parentId,
        draggedItemIds: new Set(draggedItemIds),
        draggedNodeElement: <div dangerouslySetInnerHTML={{ __html: action.payload.ev.currentTarget.outerHTML }}/>,
      }
      
      for (let id of draggedItemIds) {
        const draggedNode = getNodeObj({id:id, stateList:[newDragState, state.allUpdates, loadedNodeObj]})
        draggedNode.appearance = "dragged";
        newDragState[id] = draggedNode;
      }      

      const crt = document.getElementById(`drag-ghost-${action.payload.browserId}`)
      crt.style.position = 'absolute'
      crt.style.top = '-500px'
      crt.style.right = '-5000px'
      crt.style.opacity = 1
      crt.style.zIndex = -1
      document.body.appendChild(crt)
      action.payload.ev.dataTransfer.setDragImage(crt, 0, 0)

      return { ...state, draggedItemData: draggedItemData, dragState: newDragState, mode: "DRAGGING" }
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

      // open up dropTarget if not already opened
      if (dropTargetNode && !dropTargetNode["isOpen"]) {
        dropTargetNode["isOpen"] = true;
        newDragState[dropTargetId] = dropTargetNode;
      }
      
      let dropTargetParentChildList = [...dropTargetParentNode.childNodeIds];      

      // if dragged into another parent / initial drag
      if (previousParentId !== dropTargetParentId || !newDragState[draggedShadowId]) {
        // remove item from previous list
        previousList = previousList.filter(itemId => itemId != draggedShadowId);
        previousParentNode.childNodeIds = previousList;
        newDragState[previousParentId] = previousParentNode;

        state.draggedItemData
        // add new shadow
        const draggedShadowNodeObj = {
          label: "",
          childNodeIds: [],
          isOpen: false,
          type: "folder",
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
          previousParentNode.childNodeIds = previousList;
          previousParentNode.isOpen = true;
          draggedItemNodeObj.parentId = previousParentId;
          newAllUpdates[draggedItemId] = draggedItemNodeObj;
          newAllUpdates[previousParentId] = previousParentNode;
        }             

        // set previousParent and all its parent to be open
        let currentId = previousParentId;
        let currentNode = getNodeObj({id:previousParentId, stateList:[newAllUpdates, loadedNodeObj]})
        while (currentId != "root" && currentNode != null) {
          currentNode.isOpen = true;
          newAllUpdates[currentId] = currentNode;
          currentId = currentNode.parentId;
          currentNode = getNodeObj({id:currentNode.parentId, stateList:[newAllUpdates, loadedNodeObj]});
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

      const crt = document.getElementById(`drag-ghost-${action.payload.browserId}`)
      crt.style.opacity = 0
      document.body.appendChild(crt)

      return { ...state, draggedItemData: null, allUpdates: newAllUpdates, dragState: {}, validDrop: false, allSelected: [], mode: "READY" }
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
    props.actions().toggleFolder(props.nodeId,props.nodeObj);
  }}>X</button>

 


  let bgcolor = "#e2e2e2";
  let transition = "background-color 250ms";
  if (props.nodeObj.appearance === "selected") { bgcolor = "#6de5ff"; }
  if (props.nodeObj.appearance === "dropperview") { return <div style={{
    // width: "300px",
    height: "25px",
    border: "2px dotted #37ceff",
    backgroundColor: "white",
    margin: "2px",
    marginLeft: `${props.level * indentPx}px`
  }} /> }
  if (props.nodeObj.appearance === "dragged") { bgcolor = "#f3ff35"; }  

  if (props.nodeObj.type === "folder"){
    //**** FOLDER *****
    const toggleLabel = (props.nodeObj.isOpen) ? "Close" : "Open";
    const toggle = <button 
    onMouseDown={e=>{ e.preventDefault(); e.stopPropagation(); }}
    onDoubleClick={e=>{ e.preventDefault(); e.stopPropagation(); }}
    data-doenet-browserid={props.browserId}
    tabIndex={0}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      props.transferDispatch('TOGGLEFOLDER', { nodeId: props.nodeId, nodeObj: props.nodeObj, selectOnlyOne: props.selectOnlyOne })
      // props.actions().toggleFolder(props.nodeId,props.nodeObj);
    }}>{toggleLabel}</button>

    
  
    return <div 
    data-doenet-browserid={props.browserId}
    tabIndex={0} 
    onClick={(e) => {
      if (props.route){
        let path = "/"+props.browserId+"/"+props.nodeId+"/";
        props.history.push(path);
      }
      props.transferDispatch('CLICKITEM', { nodeId: props.nodeId, nodeObj: props.nodeObj, selectOnlyOne: props.selectOnlyOne, shiftKey: e.shiftKey, metaKey: e.metaKey })
    }} 
  
    onDoubleClick={(e) => {
      props.transferDispatch('TOGGLEFOLDER', { nodeId: props.nodeId, nodeObj: props.nodeObj, selectOnlyOne: props.selectOnlyOne})
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
      cursor: "pointer",
      width: "300px",
      padding: "4px",
      border: "1px solid black",
      transition: transition,
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
    onMouseDown={e=>{ e.preventDefault(); e.stopPropagation(); }}
    onDoubleClick={e=>{ e.preventDefault(); e.stopPropagation(); }}
    data-doenet-browserid={props.browserId}
    tabIndex={0}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      props.transferDispatch('TOGGLEFOLDER', { nodeId: props.nodeId, nodeObj: props.nodeObj, selectOnlyOne: props.selectOnlyOne })
      // props.actions().toggleFolder(props.nodeId,props.nodeObj);
    }}>{toggleLabel}</button>

    return <div 
    data-doenet-browserid={props.browserId}
    tabIndex={0} 
    onClick={(e) => {
      if (props.route){
        let path = "/"+props.browserId+"/"+props.nodeId+"/";
        props.history.push(path);
      }
      props.transferDispatch('CLICKITEM', { nodeId: props.nodeId, nodeObj: props.nodeObj, selectOnlyOne: props.selectOnlyOne, shiftKey: e.shiftKey, metaKey: e.metaKey })
    }} 
  
    onDoubleClick={(e) => {
      props.transferDispatch('TOGGLEFOLDER', { nodeId: props.nodeId, nodeObj: props.nodeObj, selectOnlyOne: props.selectOnlyOne })
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
      cursor: "pointer",
      width: "300px",
      padding: "4px",
      border: "1px solid black",
      transition: transition,
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
    tabIndex={0} 
    onClick={(e) => {
      if (props.route){
        let path = "/"+props.browserId+"/"+props.parentFolderId+"/";
        props.history.push(path);
      }
      props.transferDispatch('CLICKITEM', { nodeId: props.nodeId, nodeObj: props.nodeObj, selectOnlyOne: props.selectOnlyOne, shiftKey: e.shiftKey, metaKey: e.metaKey })
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
      cursor: "pointer",
      width: "300px",
      padding: "4px",
      border: "1px solid black",
      transition: transition,
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
    tabIndex={0} 
    onClick={(e) => {
      if (props.route){
        let path = "/"+props.browserId+"/"+props.parentFolderId+"/";
        props.history.push(path);
      }
      props.transferDispatch('CLICKITEM', { nodeId: props.nodeId, nodeObj: props.nodeObj, selectOnlyOne: props.selectOnlyOne, shiftKey: e.shiftKey, metaKey: e.metaKey })
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
      cursor: "pointer",
      width: "300px",
      padding: "4px",
      border: "1px solid black",
      transition: transition,
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
    tabIndex={0} 
    onClick={(e) => {
      if (props.route){
        let path = "/"+props.browserId+"/"+props.parentFolderId+"/";
        props.history.push(path);
      }
      props.transferDispatch('CLICKITEM', { nodeId: props.nodeId, nodeObj: props.nodeObj, selectOnlyOne: props.selectOnlyOne, shiftKey: e.shiftKey, metaKey: e.metaKey })
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
      cursor: "pointer",
      width: "300px",
      padding: "4px",
      border: "1px solid black",
      transition: transition,
      backgroundColor: bgcolor,
      margin: "2px"
    }} ><div 
    className="noselect" 
    style={{
      marginLeft: `${props.level * indentPx + 34}px`
    }}>[assignment] {props.nodeObj.label} {deleteNode}</div></div>

   
  }
  
})

const DragGhost = ({ id, element, numItems }) => {

  return (
    <div id={id} style={{position: 'absolute', opacity: "0", top: "-500px" }}>
    {
      numItems < 2 ? 
        <div
          style={{
            boxShadow: 'rgba(0, 0, 0, 0.20) 0px 0px 3px 3px',
            borderRadius: '4px',
            animation: 'dragAnimation 2s',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          { element }
        </div>
      :
      <div style={{minWidth: "300px"}}>
        <div
          style={{
            position: 'absolute',
            zIndex: "5",
            top: "-10px",
            right: "-15px",
            borderRadius: '25px',
            background: '#bc0101',
            fontSize: '12px',
            color: 'white',
            width: '25px',
            height: '25px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          {numItems}
        </div>
        <div
          style={{
            boxShadow: 'rgba(0, 0, 0, 0.30) 5px 3px 3px 0px',
            borderRadius: '4px',
            padding: "0 5px 5px 0",
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            zIndex: "1"
          }}>
          <div
            style={{
              borderRadius: '4px',
              boxShadow: 'rgba(0, 0, 0, 0.20) 0px 0px 3px 2px',
              border: '1px solid rgba(0, 0, 0, 0.20)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: "2"
            }}>
            { element }
          </div>
        </div>
      </div>
    }      
    </div>
  )
}