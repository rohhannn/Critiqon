import React from "react";
import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
} from "react-router-dom";

import App from "./App";

import NotificationCenter from "./components/NotificationCenter";

import {
  AuthProvider,
} from "./context/AuthContext";

import {
  SubscriptionProvider,
} from "./context/SubscriptionContext";

import "./index.css";


ReactDOM.createRoot(
  document.getElementById("root")!
).render(

  <React.StrictMode>

    <BrowserRouter>

      <AuthProvider>

        <SubscriptionProvider>

          <App />

          <NotificationCenter />

        </SubscriptionProvider>

      </AuthProvider>

    </BrowserRouter>

  </React.StrictMode>

);