import React from 'react';
import ReactDOM from 'react-dom';
import DoenetCourse from '../Tools/DoenetCourse';
import { initialize } from '../imports/courseInfo';
import {
  HashRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import {
  RecoilRoot
} from 'recoil';
import {
  DropTargetsProvider,
} from '../imports/DropTarget';
import { 
  BreadcrumbProvider 
} from '../imports/Breadcrumb';
initialize();


    ReactDOM.render(
      <RecoilRoot>
      <DropTargetsProvider>
      <BreadcrumbProvider>
     
        <Router>
              <Switch>
                <Route path="/" render={(routeprops) => 
                <DoenetCourse route={{ ...routeprops }}  />
                }></Route>
              </Switch> 
         </Router>
      </BreadcrumbProvider>
      </DropTargetsProvider>
      </RecoilRoot>

     
  ,document.getElementById('root'));
