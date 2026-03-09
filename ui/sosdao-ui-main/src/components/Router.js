import React, { Suspense, lazy } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Spinner } from "react-bootstrap";

import Header from "../components/header";

const FundList = lazy(() => import("../components/fundList"));
const FundCreate = lazy(() => import("../components/fundCreate"));
const Manage = lazy(() => import("../components/manage/Manage"));
const Fund = lazy(() => import("../components/fund"));
const CreateRequest = lazy(() => import("./request/CreateRequest"));
const RequestDetail = lazy(() => import("./request/RequestDetail"));
const Profile = lazy(() => import("../components/profile"));
const PageNotFound = lazy(() => import("../pages/PageNotFound"));

export default function Router() {
  return (
    <BrowserRouter>
      <Header />
      <Suspense
        fallback={
          <div className="text-center p-4">
            <Spinner animation="border" />
          </div>
        }
      >
        <Switch>
          <Route
            exact
            path="/"
            component={(props) => {
              return <FundList {...props} />;
            }}
          />
          <Route
            exact
            path="/funds"
            component={(props) => {
              return <FundList {...props} />;
            }}
          />
          <Route
            exact
            path="/manage"
            component={(props) => {
              return <Manage {...props} />;
            }}
          />
          <Route
            exact
            path="/create-fund"
            component={(props) => {
              return <FundCreate {...props} />;
            }}
          />
          <Route
            path="/funds/:fundId"
            component={(props) => {
              return <Fund {...props} />;
            }}
          />
          <Route
            path="/create-request/:fundId"
            component={(props) => {
              return <CreateRequest {...props} />;
            }}
          />
          <Route
            path="/request/:requestId"
            component={(props) => {
              return <RequestDetail {...props} />;
            }}
          />
          <Route
            path="/profile"
            component={(props) => {
              return <Profile {...props} />;
            }}
          />
          <Route component={PageNotFound} />
        </Switch>
      </Suspense>
    </BrowserRouter>
  );
}
