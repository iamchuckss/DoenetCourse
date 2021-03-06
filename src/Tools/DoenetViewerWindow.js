import React, { Component } from 'react';
import DoenetViewer from '../Tools/DoenetViewer';
import ErrorBoundary from './ErrorBoundary';

class DoenetViewerWindow extends Component {
  constructor(props){
    super(props);

    this.state = {
      modeOpen: false,
      allowViewSolutionWithoutRoundTrip: true,
      solutionType: "button",
      showHints: true,
      showFeedback: true,
      showCorrectness: true,
      allAnswersSubmitted: false,
      doenetML: "",
      error: null,
      errorInfo: null,
    };

    this.functionsSuppliedByChild = {};

    this.updateNumber = 0;
    this.updateDueToMessage = this.updateDueToMessage.bind(this);
    this.modeToggle = this.modeToggle.bind(this);
    this.setAnswersSubmittedTrueCallback = this.setAnswersSubmittedTrueCallback.bind(this);
    window.onmessage = this.updateDueToMessage;
  }

  updateHandler(e){
    let response = opener.postMessage({request: "doenetML update"},"*");
  }

  modeToggle(){
    this.setState({modeOpen:!this.state.modeOpen})
  }

  updateDueToMessage(e){


    if(e.data.doenetML !== undefined){
      this.updateNumber++;
      window.MathJax.Hub.Queue(
        ["resetEquationNumbers",window.MathJax.InputJax.TeX],
      );
      this.setState({doenetML:e.data.doenetML,error:null,errorInfo:null,
        requestedVariant: e.data.requestedVariant});
    }
  }

  componentDidCatch(error, info){

    this.setState({error:error,errorInfo:info});
  }

  handleResizeWindow(width,height){
    window.resizeTo(width,height);
    // alert(`Width ${width} Height ${height}`);
  }

  setAnswersSubmittedTrueCallback() {
    this.setState({allAnswersSubmitted: true})
  }

  render() {
    
     //We have an error so doen't show the viewer
     if (this.state.error){

      return (<React.Fragment>
        <p style={{color: "red"}}>{this.state.error && this.state.error.toString()}</p>
        </React.Fragment>);
    }

    return (<React.Fragment>
      <div>
        <button onClick={this.updateHandler} data-cy="viewerUpdateButton">Update</button>
      </div>
        <ErrorBoundary  key={"doenetErrorBoundry"+this.updateNumber}>
            <DoenetViewer 
            key={"doenetviewer"+this.updateNumber} 
            // free={{doenetCode: this.state.doenetML, requestedVariant: this.state.requestedVariant}} 
            doenetML={this.state.doenetML} 
            mode={{
              solutionType:this.state.solutionType,
              allowViewSolutionWithoutRoundTrip:this.state.allowViewSolutionWithoutRoundTrip,
              showHints:this.state.showHints,
              showFeedback:this.state.showFeedback,
              showCorrectness:this.state.showCorrectness,
            }}
            viewerExternalFunctions = {{ allAnswersSubmitted: this.setAnswersSubmittedTrueCallback}}
            functionsSuppliedByChild = {this.functionsSuppliedByChild}
            />
        </ErrorBoundary>
      </React.Fragment>);
  }
}

export default DoenetViewerWindow;

// mode={{solutionType:"displayed",allowViewSolutionWithoutRoundTrip:true}}

// {/* <Menu attached='top'>
      
//       <Menu.Item>
//         <Button onClick={this.updateHandler} data-cy="viewerUpdateButton">Update</Button>
//       </Menu.Item>
//       <Menu.Item>
//         <Button onClick={this.modeToggle} data-cy="viewerModeButton">Mode</Button>
//       </Menu.Item>
      

//       </Menu>
//       {this.state.modeOpen ? <div style={{backgroundColor:"#cce2ff", padding:"10px",borderBottom:"1px solid grey"}}>
//         <b>Modes</b><br />

//       allowViewSolutionWithoutRoundTrip <input type="checkbox" onChange={()=>{
//         this.setState({ allowViewSolutionWithoutRoundTrip:!this.state.allowViewSolutionWithoutRoundTrip });
//         this.updateNumber++;
//       }
//       }checked={this.state.allowViewSolutionWithoutRoundTrip}></input><br />
      

//       solutionType <select value={this.state.solutionType} onChange={(e)=>{
//         this.setState({solutionType:e.target.value});
//         this.updateNumber++;
//       }}>
//         <option>none</option>
//         <option>button</option>
//         <option>displayed</option>
//         </select><br />
//         showHints <input type="checkbox" onChange={()=>{
//         this.setState({ showHints:!this.state.showHints });
//         this.updateNumber++;
//       }
//       }checked={this.state.showHints}></input><br />
//       showFeedback <input type="checkbox" onChange={()=>{
//         this.setState({ showFeedback:!this.state.showFeedback });
//         this.updateNumber++;
//       }
//       }checked={this.state.showFeedback}></input><br />
//       showCorrectness <input type="checkbox" onChange={()=>{
//         this.setState({ showCorrectness:!this.state.showCorrectness });
//         this.updateNumber++;
//       }
//       }checked={this.state.showCorrectness}></input><br />

//       <button onClick={this.functionsSuppliedByChild.submitAllAnswers} >
//         submit all answers
//       </button><br />
//       All answer have been submitted (at least once): {this.state.allAnswersSubmitted ? "true" : "false"}

//       </div> : null} */}
