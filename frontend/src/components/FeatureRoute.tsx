import {
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useSubscription,
} from "../context/SubscriptionContext";

import UpgradeModal from "./UpgradeModal/UpgradeModal";


type RequiredPlan =
  | "Free"
  | "Pro"
  | "Premium";


interface Props {

  children: ReactNode;

  requiredPlan: RequiredPlan;

  featureName: string;

}


function FeatureRoute({
  children,
  requiredPlan,
  featureName,
}: Props) {

  const navigate =
    useNavigate();


  const {
    token,
    loading: authLoading,
  } =
    useAuth();


  const {
    loading: subscriptionLoading,
    hasAccess,
  } =
    useSubscription();


  const [
    showUpgrade,
    setShowUpgrade,
  ] =
    useState(true);


  // =====================================================
  // AUTH LOADING
  // =====================================================

  if (authLoading) {

    return (
      <div className="route-loading">
        Loading...
      </div>
    );

  }


  // =====================================================
  // NOT LOGGED IN
  // =====================================================

  if (!token) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }


  // =====================================================
  // SUBSCRIPTION LOADING
  // =====================================================

  if (subscriptionLoading) {

    return (
      <div className="route-loading">
        Loading...
      </div>
    );

  }


  // =====================================================
  // ACCESS GRANTED
  // =====================================================

  if (
    hasAccess(requiredPlan)
  ) {

    return <>{children}</>;

  }


  // =====================================================
  // ACCESS DENIED
  // =====================================================

  function handleClose() {

    setShowUpgrade(false);

    navigate(
      "/dashboard",
      {
        replace: true,
      }
    );

  }


  return (

    <>

      {showUpgrade && (

        <UpgradeModal
          requiredPlan={
            requiredPlan === "Free"
              ? "Pro"
              : requiredPlan
          }
          featureName={
            featureName
          }
          onClose={
            handleClose
          }
        />

      )}

    </>

  );

}


export default FeatureRoute;