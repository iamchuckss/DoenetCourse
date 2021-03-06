import React, { useEffect, useRef, useState, Suspense } from "react";
import Tool, { openOverlayByName } from "../imports/Tool/Tool";
import { useMenuPanelController } from "../imports/Tool/MenuPanel";

import Drive, { 
  folderDictionarySelector, 
  globalSelectedNodesAtom, 
  folderDictionary, 
  clearAllSelections, 
  fetchDrivesSelector,
  encodeParams
} from "../imports/Drive";
import nanoid from 'nanoid';


import {
  useHistory
} from "react-router-dom";
// import AddItem from '../imports/AddItem'
// import Switch from "../imports/Switch";
import Button from "../imports/PanelHeaderComponents/Button";
import {
  atom,
  useSetRecoilState,
  useRecoilState,
  useRecoilValue,
  selector,
  atomFamily,
  selectorFamily,
  useRecoilValueLoadable,
  useRecoilStateLoadable,
} from "recoil";
import { BreadcrumbContainer } from "../imports/Breadcrumb";
// import { supportVisible } from "../imports/Tool/SupportPanel";
import GlobalFont from "../fonts/GlobalFont.js";
import axios from "axios";
// import Button from "../imports/PanelHeaderComponents/Button.js";
import DoenetViewer from './DoenetViewer';
import {Controlled as CodeMirror} from 'react-codemirror2'
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import crypto from 'crypto';
import DriveCard from '../imports/DoenetDriveCard';
import { useTransition, a, useSprings, interpolate } from "react-spring";
import useMedia from "./useMedia";
import "../imports/drivecard.css";

export const drivecardSelectedNodesAtom = atom({
  key:'drivecardSelectedNodesAtom',
  default:[]
})

const selectedDriveInformation = selector({
  key:"selectedDriveInformation",
   get: ({get})=>{
    const driveSelected = get(drivecardSelectedNodesAtom);
    return driveSelected;
  },
  set:(newObj)=>({set})=>{
    set(drivecardSelectedNodesAtom,(old)=>[...old,newObj])
  }
})
const itemVersionsSelector = selectorFamily({
  key:"itemInfoSelector",
  get:(branchId)=> async ()=>{
    // Load versions from database
    const { data } = await axios.get(
      `/api/loadVersions.php?branchId=${branchId}`
    );
    return data.versions
  }
})

const selectedInformation = selector({
  key:"selectedInformation",
  get: ({get})=>{
    const globalSelected = get(globalSelectedNodesAtom);
    if (globalSelected.length !== 1){
      return {number:globalSelected.length}
    }
    //Find information if only one item selected
    const driveId = globalSelected[0].driveId;
    const folderId = globalSelected[0].parentFolderId;
    let folderInfo = get(folderDictionary({driveId,folderId})); 
    const itemId = globalSelected[0].itemId;
    let itemInfo = folderInfo.contentsDictionary[itemId];
    let versions = [];
    if (itemInfo.itemType === "DoenetML"){
      let branchId = itemInfo.branchId;
      versions = get(itemVersionsSelector(branchId))
    }
    return {number:globalSelected.length,itemInfo,versions}
  }
})

const fileByContentId = atomFamily({
  key:"fileByContentId",
  default: selectorFamily({
    key:"fileByContentId/Default",
    get:(contentId)=> async ()=>{
      if (!contentId){
        return "";
      }
      return await axios.get(`/media/${contentId}`) 
    }
  })
  
})

const editorDoenetMLAtom = atom({
  key:"editorDoenetMLAtom",
  default:""
})

const cancelAutoSaveAtom = atom({
  key:"cancelAutoSaveAtom",
  default:false
})

function TextEditor(props){
  const [editorDoenetML,setEditorDoenetML] = useRecoilState(editorDoenetMLAtom);
  const setVersion = useSetRecoilState(updateItemHistorySelector(props.branchId))
  const [cancelAutoSave,setCancelAutoSave] = useRecoilState(cancelAutoSaveAtom);

  const timeout = useRef(null);
  const autosavetimeout = useRef(null);

  if (cancelAutoSave){
    if (autosavetimeout.current !== null){
      clearTimeout(autosavetimeout.current)
    }
    setCancelAutoSave(false);
  }

  //Used to work around second mount of codemirror with the same value it doesn't display value
  const trackMount = useRef("Init");
  let value = editorDoenetML;
  if (trackMount.current === "Init"){
    value = "";
  }

  return <CodeMirror
  editorDidMount={()=>trackMount.current = "Mount"}
  value={value}
  // options={options}
  onBeforeChange={(editor, data, value) => {
    console.log(">>>onBeforeChange",value)
    setEditorDoenetML(value)
    if (timeout.current === null){
      timeout.current = setTimeout(function(){
        setVersion({instructions:{type:"Save Draft"}})
        timeout.current = null;
      },3000)
    }
    if (autosavetimeout.current === null){
      autosavetimeout.current = setTimeout(function(){
        setVersion({instructions:{type:"Autosave"}})
        autosavetimeout.current = null;
      },5000) //TODO: Make 5 minutes 300000
    }
  }}
  // onChange={(editor, data, value) => {
  // }}
  onBlur={()=>{
    if (timeout.current !== null){
      clearTimeout(timeout.current)
      timeout.current = null;
      setVersion({instructions:{type:"Save Draft"}})
    }
    if (autosavetimeout.current !== null){
      clearTimeout(autosavetimeout.current)
    }
  }}
/>
}

const viewerDoenetMLAtom = atom({
  key:"viewerDoenetMLAtom",
  default:{updateNumber:0,doenetML:""}
})

function DoenetViewerUpdateButton(){
  const editorDoenetML = useRecoilValue(editorDoenetMLAtom);
  const setViewerDoenetML = useSetRecoilState(viewerDoenetMLAtom);

  return <button onClick={()=>{setViewerDoenetML((old)=>{
    let newInfo = {...old};
    newInfo.doenetML = editorDoenetML;
    newInfo.updateNumber = old.updateNumber+1;
    return newInfo;
  })}}>Update</button>
}

const getSHAofContent = (doenetML)=>{
  const hash = crypto.createHash('sha256');
  if (doenetML === undefined){
    return;
  }
  hash.update(doenetML);
  let contentId = hash.digest('hex');
  return contentId;
}

const itemHistoryAtom = atomFamily({
  key:"itemHistoryAtom",
  default: selectorFamily({
    key:"itemHistoryAtom/Default",
    get:(branchId)=> async ()=>{
      if (!branchId){
        return "";
      }
      const { data } = await axios.get(
        `/api/loadVersions.php?branchId=${branchId}`
      );
      return data.versions
    }
  })
})

const updateItemHistorySelector = selectorFamily({
  key:"updateItemHistorySelector",
  get:(branchId)=> ({get})=>{
    return get(itemHistoryAtom(branchId))
  },
  set:(branchId)=> ({get,set},instructions)=>{
    console.log(">>>instructions.type",instructions.instructions.type)
    const doenetML = get(editorDoenetMLAtom);
    const contentId = getSHAofContent(doenetML);
    const dt = new Date();
    const timestamp = `${
      dt.getFullYear().toString().padStart(2, '0')}-${
      (dt.getMonth()+1).toString().padStart(2, '0')}-${
      dt.getDate().toString().padStart(2, '0')} ${
      dt.getHours().toString().padStart(2, '0')}:${
      dt.getMinutes().toString().padStart(2, '0')}:${
      dt.getSeconds().toString().padStart(2, '0')}`

      let title = timestamp;
      let isNamed = "0";
      let draft = false;

      if (instructions.instructions.type === "Name Current Version"){
        isNamed = "1";
      }else if (instructions.instructions.type === "Save Draft"){
        draft = true;
        title = "draft";
       } else if (instructions.instructions.type === "Autosave"){
        title = "Autosave";
       } 


    let newVersion = {
      title:timestamp,
      contentId,
      timestamp,
      isDraft: "0",
      isNamed
    }

    if (!draft){
      set(itemHistoryAtom(branchId),(oldVersions)=>{return [...oldVersions,newVersion]})
      set(fileByContentId(contentId),{data:doenetML})
    }else{
      set(fileByContentId(branchId),{data:doenetML})
    }
    axios.post("/api/saveNewVersion.php",{title,branchId,doenetML,isNamed,draft})
     .then((resp)=>{console.log(">>>resp",resp.data)})
  }
})

// const saveDraftSelector = selectorFamily({
//   key:"fileByContentIdSelector",

//   set:(branchId)=>({set,get})=>{
//     const doenetML = get(editorDoenetMLAtom);
//     set(fileByContentId(branchId),{data:doenetML});
//     axios.post("/api/saveNewVersion.php",{branchId,doenetML,draft:true})
//     // .then((resp)=>{console.log(">>>resp",resp.data)})
//   }
// })

function VersionHistoryPanel(props){
  const [versionHistory,setVersion] = useRecoilStateLoadable(updateItemHistorySelector(props.branchId))

  if (versionHistory.state === "loading"){ return null;}
  if (versionHistory.state === "hasError"){ 
    console.error(versionHistory.contents)
    return null;}


    var currentVersionInfo;

    let pastVersions = [];
  for (let version of versionHistory.contents){
    if (version.isDraft === "1"){
      currentVersionInfo = version;
    }else{
      let title = version.timestamp;
      let nameItButton = <button>Name Version</button>;

      if (version.isNamed === "1"){
        title = version.title;
        nameItButton = <button>Rename Version</button>
      }


      pastVersions.push(<div key={`pastVersion${version.timestamp}`}>
        <div><b>{title}</b></div>
        <div>{version.timestamp}</div>
        <div><button>View</button>{nameItButton}<button>Make a Copy</button></div>
        </div>)

    }
  }


  const currentVersion = <div>
    <div><b>Current Version</b></div>
    <div>{currentVersionInfo.timestamp}</div>
    <div><button>View</button>
    <button onClick={()=>{
    setVersion({instructions:{type:"Name Current Version"}}) }}>Name Version</button>
    <button>Make a Copy</button></div>
    </div>

  
  return <>
  {currentVersion}
  {pastVersions}
  </>
}

function NameCurrentVersionControl(props){
  const setVersion = useSetRecoilState(updateItemHistorySelector(props.branchId))
  const setCancelAutoSave = useSetRecoilState(cancelAutoSaveAtom);
  return <>
  <button onClick={()=>{
    setVersion({instructions:{type:"Name Current Version"}})
    setCancelAutoSave(true);
    }}>Name Current Version</button>
  </>
  
}

let overlayTitleAtom = atom({
  key:"overlayTitleAtom",
  default:""
})

function DoenetViewerPanel(){
  const viewerDoenetML = useRecoilValue(viewerDoenetMLAtom);
  let attemptNumber = 1;
  let requestedVariant = { index: attemptNumber }
  let assignmentId = "myassignmentid";
  let solutionDisplayMode = "button";

  return <DoenetViewer
      key={"doenetviewer" + viewerDoenetML?.updateNumber}
      doenetML={viewerDoenetML?.doenetML}
      flags={{
        showCorrectness: true,
        readOnly: false,
        solutionDisplayMode: solutionDisplayMode,
        showFeedback: true,
        showHints: true,
      }}
      attemptNumber={attemptNumber}
      assignmentId={assignmentId}
      ignoreDatabase={false}
      requestedVariant={requestedVariant}
      /> 
}

//When contentId changes then set the new loaded info into the editor atoms
function SetEditorDoenetMLandTitle(props){
  let contentId = props.contentId;
  if (props.isDraft){ contentId = props.branchId;}
  const loadedDoenetML = useRecoilValueLoadable(fileByContentId(contentId))
  const setEditorDoenetML = useSetRecoilState(editorDoenetMLAtom);
  const setViewerDoenetML = useSetRecoilState(viewerDoenetMLAtom);
  let lastContentId = useRef("");
  const overlayInfo = useRecoilValue(openOverlayByName);
  const setEditorOverlayTitle = useSetRecoilState(overlayTitleAtom);

  //Set only once
  if (lastContentId.current !== contentId){
    if (loadedDoenetML.state === "hasValue"){
      let overlayTitle = overlayInfo?.instructions?.title;
      setEditorOverlayTitle(overlayTitle)
      let doenetML = loadedDoenetML?.contents?.data;
      setEditorDoenetML(doenetML);
      setViewerDoenetML((old)=>{
        let newInfo = {...old};
        newInfo.doenetML = doenetML;
        newInfo.updateNumber = old.updateNumber+1;
        return newInfo;
      })
      lastContentId.current = contentId; //Don't set again
    }
  }


return null;
}

const ItemInfo = function (){
  // console.log("=== 🧐 Item Info")
  const infoLoad = useRecoilValueLoadable(selectedInformation);
  const driveSelections = useRecoilValue(selectedDriveInformation);
  console.log(">>>> driveSelections!!!!!! HERE", driveSelections);
  const setOverlayOpen = useSetRecoilState(openOverlayByName);
  // const selectedDrive = useRecoilValue(selectedDriveAtom);




    if (infoLoad.state === "loading"){ return null;}
    if (infoLoad.state === "hasError"){ 
      console.error(infoLoad.contents)
      return null;}
   
      let itemInfo = infoLoad?.contents?.itemInfo;

    if (infoLoad.contents?.number > 1){
      return <>
      <h1>{infoLoad.contents.number} Items Selected</h1>
      </>
    }else if (infoLoad.contents?.number < 1){

    if (!itemInfo) return <h3>No Items Selected</h3>;
  }

 
  if (itemInfo?.itemType === "DoenetML"){
    
    console.log({itemInfo})

  return <div
  style={{height:"100%"}}
  >
  <h1>{itemInfo.label}</h1>
  
  <button 
  onClick={()=>setOverlayOpen({
    name: "editor", //to match the prop
    instructions: { 
      supportVisble: true,
      action: "open", //or "close"
      // contentId: draftObj.contentId,
      // branchId: itemInfo.branchId,
      // title: draftObj.title,
      // isDraft: draftObj.isDraft,
      // timestamp: draftObj.timestamp
    }
  })}>Edit</button>
  </div>
    }


  return <div
  style={{height:"100%"}}
  >
  <h1>{itemInfo.label}</h1>
  </div>
}

function AddContentDriveButton(props){
  const history = useHistory();

  const [_,setNewDrive] = useRecoilState(fetchDrivesSelector)

  return <Button text="Add Content Drive" callback={()=>{
    let driveId = null;
    let newDriveId = nanoid();
    let label = "Untitled";
    setNewDrive({label,type:"new content drive",driveId,newDriveId})
    let urlParamsObj = Object.fromEntries(new URLSearchParams(props.route.location.search));
    let newParams = {...urlParamsObj} 
    // newParams['path'] = `${newDriveId}:${newDriveId}:${newDriveId}:Drive`
    newParams['path'] = `:::`
    history.push('?'+encodeParams(newParams))
  }}/>
}

function AddCourseDriveButton(props){
  const history = useHistory();

  const [_,setNewDrive] = useRecoilState(fetchDrivesSelector)

  return <Button text="Add Course Drive" callback={()=>{
    let driveId = null;
    let newDriveId = nanoid();
    let label = "Untitled";
    setNewDrive({label,type:"new course drive",driveId,newDriveId})
    let urlParamsObj = Object.fromEntries(new URLSearchParams(props.route.location.search));
    let newParams = {...urlParamsObj} 
    // newParams['path'] = `${newDriveId}:${newDriveId}:${newDriveId}:Drive`
    newParams['path'] = `:::`
    history.push('?'+encodeParams(newParams))

  }}/>
}

function AddMenuPanel(props){
  let path = ":";
  if (props?.route?.location?.search){
      path = Object.fromEntries(new URLSearchParams(props.route.location.search))?.path;
  }
  let [driveId,folderId] = path.split(":");
  const [_, setFolderInfo] = useRecoilStateLoadable(folderDictionarySelector({driveId, folderId}))


  let addDrives = <>
  <Suspense fallback={<p>Failed to make add content drive button</p>} >
     <AddContentDriveButton route={props.route} />
   </Suspense>
   <Suspense fallback={<p>Failed to make add course drive button</p>} >
     <AddCourseDriveButton route={props.route} />
   </Suspense>
   </>

let [folderLabel,setFolderLabel] = useState("")
let [doenetMLLabel,setDoenetMLLabel] = useState("")

  if (driveId === ""){ return <>{addDrives}</>; }



  // let [URLLabel,setURLLabel] = useState("")
  // let [URLLink,setURLLink] = useState("")
  // let [driveLabel,setDriveLabel] = useState("")
  // let [courseDriveLabel,setCourseDriveLabel] = useState("")



//   let addDrive =  [<div key="new drive" style={{marginBottom:"10px"}}>
//   <h3>Content Drive</h3>
//   <label>Label <input size="10" type="text"  onChange={(e)=>setDriveLabel(e.target.value)} value={driveLabel}/></label><Button callback={()=>{
//     const label = driveLabel === "" ? "Untitled" : driveLabel;
//     let newDriveId = nanoid();
//     setNewDrive({label,type:"new content drive",driveId,newDriveId})
//     setDriveLabel("")
//     let urlParamsObj = Object.fromEntries(new URLSearchParams(props.route.location.search));
//     let newParams = {...urlParamsObj} 
//     newParams['path'] = `${newDriveId}:${newDriveId}:${newDriveId}:Drive`
//     history.push('?'+encodeParams(newParams))
//     }} text="New Drive" />
// </div>]

//   addDrive.push(<div key="course from content drive">
//   <h3>Make a Course Drive</h3>
// <label>Label <input size="10" type="text"  onChange={(e)=>setCourseDriveLabel(e.target.value)} value={courseDriveLabel}/></label><Button callback={()=>{
//   const label = courseDriveLabel === "" ? "Untitled" : courseDriveLabel;
//   let newDriveId = nanoid();
//   setNewDrive({label,type:"make course drive from content drive",driveId,newDriveId})
//   setCourseDriveLabel("")
//   let urlParamsObj = Object.fromEntries(new URLSearchParams(props.route.location.search));
//     let newParams = {...urlParamsObj} 
//     newParams['path'] = `${newDriveId}:${newDriveId}:${newDriveId}:Drive`
//     history.push('?'+encodeParams(newParams))
//   }} text="Make Course" />
// </div>)



  return <>
   {addDrives}
  <hr width="100"/>
  <h3>Folder</h3>
  <div>
    <label>Label <input size="10" type="text" onChange={(e)=>setFolderLabel(e.target.value)} value={folderLabel}/></label><Button callback={()=>{
     setFolderInfo({instructionType:"addItem",
      label:folderLabel === "" ? "Untitled" : folderLabel,
      itemType:"Folder"
      })
      setFolderLabel("");
    }} text="Add" />
  </div>
  <h3>DoenetML</h3>
  <div>
    <label>Label <input size="10" type="text" onChange={(e)=>setDoenetMLLabel(e.target.value)} value={doenetMLLabel}/></label><Button callback={()=>{
      setFolderInfo({instructionType:"addItem",
      label:doenetMLLabel === "" ? "Untitled" : doenetMLLabel,
      itemType:"DoenetML"
      })
      setDoenetMLLabel("");
      }} text="Add" />
  </div>
  {/* <h3>URL</h3>
  <div>
    <label>Label <input size="10" type="text" onChange={(e)=>setURLLabel(e.target.value)} value={URLLabel} /></label>
  </div>
  <div>
    <label>URL <input size="10" type="text" onChange={(e)=>setURLLink(e.target.value)} value={URLLink}/></label>
  <Button callback={()=>{
    setFolderInfo({instructionType:"addItem",
    label:URLLabel === "" ? "Untitled" : URLLabel,
    url:URLLink,
    itemType:"url"
    })
    setURLLink("");
  }} text="Add" />

  </div> */}

  </>
}

const EditorTitle = ()=>{
  const overlayTitle = useRecoilValue(overlayTitleAtom);
  return <span>{overlayTitle}</span>
}

const DriveCardComponent = React.memo((props) => {
  const history = useHistory();
  let encodeParams = (p) =>
    Object.entries(p)
      .map((kv) => kv.map(encodeURIComponent).join("="))
      .join("&");
  let transitions = "";

  const columns = useMedia(
    [
      "(min-width: 1500px)",
      "(min-width: 1000px)",
      "(min-width: 600px)",
      "(min-width: 400px)",
    ],
    [5, 4, 3, 2],
    1
  );
  let heights = [];
  // console.log(">>>> props.drivesIds",props.drivesIds );
  let driveCardItem = props.drivesIds.map((child, i) => {
    heights = new Array(columns).fill(0);
    let width = window.innerWidth - 400;
    const column = heights.indexOf(Math.min(...heights)); // Basic masonry-grid placing, puts tile into the smallest column using Math.min
    const xy = [(width / columns) * column, (heights[column] += 250) - 250]; // X = container width / number of columns * column index, Y = it's just the height of the current column
    return { ...child, xy, width: 250, height: 250 };
  });
  if (props.drivesIds.length > 0) {
    transitions = useTransition(driveCardItem, (item) => item.driveId, {
      from: ({ xy, width, height }) => ({
        xy,
        width,
        height,
        opacity: 0,
        scale: 1.1
      }),
      enter: ({ xy, width, height }) => ({
        xy,
        width,
        height,
        opacity: 1,
        scale: 1
      }),
      update: ({ xy, width, height }) => ({ xy, width, height, scale: 1 }),
      leave: { height: 0, opacity: 0, scale: 0 },
      config: { mass: 5, tension: 500, friction: 100 },
      trail: 25
    });
  }

  function driveCardSelector(item) {
    let newParams = {};
    newParams["path"] = `${item.driveId}:${item.driveId}:${item.driveId}:Drive`;
    history.push("?" + encodeParams(newParams));
  }
  const handleKeyDown = (e, item) => {
    if (e.key === "Enter") {
      let newParams = {};
      newParams[
        "path"
      ] = `${item.driveId}:${item.driveId}:${item.driveId}:Drive`;
      history.push("?" + encodeParams(newParams));
    }
  };
  const [on, toggle] = useState(false);
  const textUse = useRef();

  const setDrivecardSelection = useSetRecoilState(drivecardSelectedNodesAtom)
  const drivecardSelectedValue = useRecoilValue(drivecardSelectedNodesAtom);
  // drive selection 
  const drivecardselection = (e,item) =>{
   e.preventDefault();
   e.stopPropagation();
   if (!e.shiftKey && !e.metaKey){
    setDrivecardSelection((old) => [item]);
  }else if (e.shiftKey && !e.metaKey){
    setDrivecardSelection((old) => [...old,item]);
  }else if (!e.shiftKey && e.metaKey){
    setDrivecardSelection((old) => [item]);
  }

  //  console.log('>>>> drivecard selection item', item);
  //console.log('>>>> drivecardSelectedValue onclick@@@@@ewfc23456', drivecardSelectedValue);

 }

 const getSelectedCard = (cardItem) => {
  let avalibleCard = drivecardSelectedValue.filter((i)=>i.driveId === cardItem.driveId);
  return avalibleCard.length > 0 ? true : false;
 }

  return (
    <div className="drivecardContainer">
      {transitions.map(({ item, props }, index) => {
        //  console.log(">>>  item props !!!!!!!!", item);
        let selectedCard = getSelectedCard(item);
        return (
          <a.div
            className="adiv"
            key={index}
            ref={textUse}
            // onMouseOver={() => toggle(props.scale.setValue(1.1))}
            // onMouseLeave={() => toggle(props.scale.setValue(1))}
            style={{
              transform: props.xy.interpolate(
                (scale) => `scale(${props.scale.value})`
              ),
              ...props,
            }}
          >
            <div
              className={`drivecardlist ${selectedCard ? 'borderselection' : ''}`}
              tabIndex={index}
              // tabIndex={0}
              // onclick scale
              onClick = {(e) => drivecardselection(e,item)}
              onKeyDown={(e) => handleKeyDown(e, item)}
              onDoubleClick={() => driveCardSelector(item)}
            >
              <DriveCard
                driveId={item.driveId}
                image={item.image}
                color={item.color}
                label={item.label}
              />
            </div>
           </a.div>
        );
      })}
    </div>
  );
});

export default function DoenetDriveTool(props) {
  console.log("=== 💾 Doenet Drive Tool");  
  // const setOverlayOpen = useSetRecoilState(openOverlayByName);
  const [overlayInfo,setOverlayOpen] = useRecoilState(openOverlayByName);
  const setOpenMenuPanel = useMenuPanelController();

  // const setSupportVisiblity = useSetRecoilState(supportVisible);
  const clearSelections = useSetRecoilState(clearAllSelections);
  const setDrivecardSelection = useSetRecoilState(drivecardSelectedNodesAtom)

  const drivecardSelectedValue = useRecoilValue(drivecardSelectedNodesAtom);
  let routePathDriveId = "";
  let urlParamsObj = Object.fromEntries(
    new URLSearchParams(props.route.location.search)
  );
  if (urlParamsObj?.path !== undefined) {
    [
      routePathDriveId
    ] = urlParamsObj.path.split(":");
  }

  //Select +Add menuPanel if no drives selected on startup
  useEffect(()=>{
    if (routePathDriveId === ""){
      setOpenMenuPanel(1)
    }
  },[]);

  
  let textEditor = null;
  let doenetViewerEditorControls = null;
  let doenetViewerEditor = null;
  let setLoadContentId = null;
  let editorTitle = null;
  let versionHistory = null;

  if (overlayInfo?.name === "editor"){
    const contentId = overlayInfo?.instructions?.contentId;
    const branchId = overlayInfo?.instructions?.branchId;
    const isDraft = overlayInfo?.instructions?.isDraft;
    editorTitle = overlayInfo?.instructions?.title;
    setLoadContentId = <SetEditorDoenetMLandTitle contentId={contentId} branchId={branchId} isDraft={isDraft} />
    textEditor = <div><NameCurrentVersionControl branchId={branchId} /><TextEditor  branchId={branchId}/></div>
    doenetViewerEditorControls = <div><DoenetViewerUpdateButton  /></div>
    doenetViewerEditor =  <DoenetViewerPanel />
    versionHistory = <VersionHistoryPanel branchId={branchId} />
  }
  
  const history = useHistory();

  function useOutsideDriveSelector() {

    let newParams = {};
    newParams["path"] = `:::`;
    history.push("?" + encodeParams(newParams));
  }
  function cleardrivecardSelection(){
    setDrivecardSelection([]);
    // let newParams = {};
    // newParams["path"] = `:::`;
    // history.push("?" + encodeParams(newParams));
  }
  const drivesInfo = useRecoilValueLoadable(fetchDrivesSelector);
  let drivesIds = [];
  if (drivesInfo.state === "hasValue") {
    drivesIds = drivesInfo.contents.driveIdsAndLabels;
  }
  // Breadcrumb container
  let breadcrumbContainer = null;
  if (routePathDriveId) {
    breadcrumbContainer = <BreadcrumbContainer />;
  }

  // Drive cards component
  let drivecardComponent = null;
  if (drivesIds && drivesIds.length > 0 && routePathDriveId === "") {
    drivecardComponent = <DriveCardComponent style={mainPanelStyle} drivesIds={drivesIds}/>;
  } else if (drivesIds.length === 0 && routePathDriveId === "") {
    drivecardComponent = (
      <h2>You have no drives. Add one using the Menu Panel --> </h2>
    );
  }
  
  let mainPanelStyle ={
    height:'100%',
    width:'100%'
  }
  if(routePathDriveId === ''){
    mainPanelStyle = {}
  }
  

  return (
    <Tool>
      <navPanel>
      <GlobalFont/>
      <div style={{marginBottom:"40px",height:"100vh"}} 
       onClick={useOutsideDriveSelector} >
      <Drive types={['content','course']}  foldersOnly={true} />
      </div>
      </navPanel>

      <headerPanel title="Drive">
        {/* <p>Drive</p> */}
      </headerPanel>

      <mainPanel>

      {breadcrumbContainer}
        <div 
        onClick={()=>{
          clearSelections()
        }}
        style={mainPanelStyle}
        >
        <Drive types={['content','course']}  urlClickBehavior="select" 
        doenetMLDoubleClickCallback={(info)=>{
          setOverlayOpen({
            name: "editor", //to match the prop
            instructions: { 
              supportVisble: true,
              action: "open", //or "close"
              contentId: info.item.contentId,
              branchId: info.item.branchId,
              title: info.item.label,
              isDraft: '1',
              timestamp: info.item.creationDate
            }
          });
          }}/>

     
        </div>

        <div 
        onClick={
          cleardrivecardSelection
        }
        tabIndex={0}
        style={{width:"100%",height:"100%"}}
        >
       {drivecardComponent}
        </div>
        
          
        </mainPanel>
      <supportPanel>
      <Drive types={['content','course']}  urlClickBehavior="select" />
      </supportPanel>

      <menuPanel title="Selected">
        {/* <ItemInfo route={props.route} /> */}
        <ItemInfo  />
      </menuPanel>
      <menuPanel title="+ Add Items">
       <AddMenuPanel route={props.route} />
      </menuPanel>

      <overlay name="editor">
        <headerPanel title={editorTitle}>
          {/* {editorTitle} */}
          {/* <p>{overlayInfo?.instructions?.title}</p> */}
        </headerPanel>

        <mainPanel>
          {setLoadContentId}
          {doenetViewerEditorControls}
          {doenetViewerEditor}
        </mainPanel>

        <supportPanel width="40%">
          {textEditor}
        </supportPanel>

        <menuPanel title="Version history">
        {versionHistory}
      </menuPanel>
  
      </overlay>

     
    </Tool>
  );
}
