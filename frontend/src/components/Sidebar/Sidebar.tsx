import "./Sidebar.css";

import type {
  ReactNode,
} from "react";

import {
  useState,
} from "react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  FileText,
  Briefcase,
  FileSignature,
  MessageSquare,
  History,
  BarChart3,
  Settings,
  LogOut,
  Lock,
} from "lucide-react";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  useSubscription,
} from "../../context/SubscriptionContext";

import UpgradeModal from "../UpgradeModal/UpgradeModal";


type Plan =
  | "Free"
  | "Pro"
  | "Premium";


interface Feature {

  name: string;

  path: string;

  icon: ReactNode;

  requiredPlan: Plan;

}


function Sidebar() {

  const navigate =
    useNavigate();


  const {
    logout,
  } =
    useAuth();


  const {
    plan,
    hasAccess,
    loading,
  } =
    useSubscription();


  const [
    upgradeFeature,
    setUpgradeFeature,
  ] =
    useState<Feature | null>(
      null
    );


  // =====================================================
  // FEATURES
  //
  // IMPORTANT:
  // All features are intentionally visible.
  // Access is controlled when clicked.
  // =====================================================

  const features: Feature[] = [

    {
      name: "Dashboard",
      path: "/dashboard",
      icon: (
        <LayoutDashboard
          size={20}
        />
      ),
      requiredPlan: "Free",
    },

    {
      name: "Resume Analysis",
      path: "/resume-analysis",
      icon: (
        <FileText
          size={20}
        />
      ),
      requiredPlan: "Free",
    },

    {
      name: "Job Match",
      path: "/job-match",
      icon: (
        <Briefcase
          size={20}
        />
      ),
      requiredPlan: "Pro",
    },

    {
      name: "Cover Letter",
      path: "/cover-letter",
      icon: (
        <FileSignature
          size={20}
        />
      ),
      requiredPlan: "Pro",
    },

    {
      name: "Interview Prep",
      path: "/interview-prep",
      icon: (
        <MessageSquare
          size={20}
        />
      ),
      requiredPlan: "Pro",
    },

    {
      name: "Interview History",
      path: "/interview-history",
      icon: (
        <History
          size={20}
        />
      ),
      requiredPlan: "Pro",
    },

    {
      name: "Reports",
      path: "/reports",
      icon: (
        <BarChart3
          size={20}
        />
      ),
      requiredPlan: "Premium",
    },

    {
      name: "Settings",
      path: "/settings",
      icon: (
        <Settings
          size={20}
        />
      ),
      requiredPlan: "Free",
    },

  ];


  // =====================================================
  // CLICK FEATURE
  // =====================================================

  function handleFeatureClick(
    feature: Feature,
    event: React.MouseEvent
  ) {

    /*
     * While subscription is loading,
     * don't make an incorrect access decision.
     */

    if (loading) {

      event.preventDefault();

      return;

    }


    if (
      !hasAccess(
        feature.requiredPlan
      )
    ) {

      event.preventDefault();

      setUpgradeFeature(
        feature
      );

    }

  }


  // =====================================================
  // LOGOUT
  // =====================================================

  function handleLogout() {

    logout();

    navigate(
      "/login"
    );

  }


  return (

    <>

      <aside className="sidebar">

        {/* =================================================
            LOGO
        ================================================= */}

        <div className="logo">
          Critiqon
        </div>


        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="sidebar-menu">

          {features.map(
            (feature) => {

              const locked =
                !loading &&
                !hasAccess(
                  feature.requiredPlan
                );


              return (

                <NavLink
                  key={
                    feature.path
                  }

                  to={
                    feature.path
                  }

                  onClick={(
                    event
                  ) =>
                    handleFeatureClick(
                      feature,
                      event
                    )
                  }

                  className={({
                    isActive,
                  }) =>
                    isActive
                      ? "active"
                      : ""
                  }

                >

                  {feature.icon}


                  <span>
                    {feature.name}
                  </span>


                  {locked && (

                    <Lock
                      size={14}
                      className="feature-lock"
                    />

                  )}

                </NavLink>

              );

            }
          )}

        </nav>


        {/* =================================================
            CURRENT PLAN
        ================================================= */}

        <div
          style={{
            margin:
              "auto 16px 12px",

            padding:
              "10px 12px",

            borderRadius:
              "10px",

            background:
              "rgba(79, 122, 101, 0.08)",

            fontSize:
              "12px",

            color:
              "#6b756f",
          }}
        >

          Current Plan:{" "}

          <strong>
            {plan}
          </strong>

        </div>


        {/* =================================================
            LOGOUT
        ================================================= */}

        <button
          className="logout-btn"
          onClick={
            handleLogout
          }
        >

          <LogOut
            size={18}
          />

          <span>
            Logout
          </span>

        </button>

      </aside>


      {/* =================================================
          UPGRADE MODAL
      ================================================= */}

      {upgradeFeature && (

        <UpgradeModal
          requiredPlan={
            upgradeFeature.requiredPlan ===
            "Premium"
              ? "Premium"
              : "Pro"
          }
          featureName={
            upgradeFeature.name
          }
          onClose={() =>
            setUpgradeFeature(
              null
            )
          }
        />

      )}

    </>

  );

}


export default Sidebar;