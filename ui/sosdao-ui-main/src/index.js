import React from "react";
import { Provider } from "react-redux";
import { loadState } from "./redux/localStorage";
import { configureStore } from "./redux/store";
import { createRoot } from "react-dom/client";
import App from "./components/App";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/index.scss";
import ThemeProvider from "./components/ThemeProvider";

const initialState = loadState();
const store = configureStore(initialState);

const domNode = document.getElementById("app");
const root = createRoot(domNode);

root.render(
  <Provider store={store}>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </Provider>
);
