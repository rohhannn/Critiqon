import "./Topbar.css";

import {
  Search,
  Bell,
  UserCircle,
  X,
  LogOut,
  CreditCard,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../../services/api";

import {
  useAuth,
} from "../../context/AuthContext";


interface SubscriptionData {
  plan: string;
  status: string;
  started_at: string | null;
  expires_at: string | null;
}


interface SearchItem {
  name: string;
  path: string;
}


type UpgradePlan = "pro" | "premium";


function Topbar() {

  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();


  // =====================================================
  // SUBSCRIPTION
  // =====================================================

  const [
    subscription,
    setSubscription,
  ] =
    useState<SubscriptionData | null>(
      null
    );


  const [
    subscriptionLoading,
    setSubscriptionLoading,
  ] =
    useState(true);


  // =====================================================
  // SEARCH
  // =====================================================

  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    showSearchResults,
    setShowSearchResults,
  ] =
    useState(false);


  // =====================================================
  // DROPDOWNS
  // =====================================================

  const [
    showNotifications,
    setShowNotifications,
  ] =
    useState(false);


  const [
    showProfile,
    setShowProfile,
  ] =
    useState(false);


  // =====================================================
  // SEARCH ITEMS
  // =====================================================

  const searchItems: SearchItem[] = [

    {
      name: "Dashboard",
      path: "/dashboard",
    },

    {
      name: "Resume Analysis",
      path: "/resume-analysis",
    },

    {
      name: "Job Match",
      path: "/job-match",
    },

    {
      name: "Cover Letter",
      path: "/cover-letter",
    },

    {
      name: "Interview Prep",
      path: "/interview-prep",
    },

    {
      name: "Interview History",
      path: "/interview-history",
    },

    {
      name: "Reports",
      path: "/reports",
    },

    {
      name: "Settings",
      path: "/settings",
    },

  ];


  // =====================================================
  // FILTER SEARCH
  // =====================================================

  const filteredSearchItems =
    searchItems.filter(
      (item) =>
        item.name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );


  // =====================================================
  // LOAD SUBSCRIPTION
  // =====================================================

  useEffect(() => {

    async function loadSubscription() {

      try {

        setSubscriptionLoading(true);


        const response =
          await api.get<SubscriptionData>(
            "/payments/subscription"
          );


        setSubscription(
          response.data
        );

      } catch (error) {

        console.error(
          "Failed to load subscription:",
          error
        );


        setSubscription(null);

      } finally {

        setSubscriptionLoading(false);

      }

    }


    if (user) {

      loadSubscription();

    } else {

      setSubscription(null);

      setSubscriptionLoading(false);

    }

  }, [user]);


  // =====================================================
  // PLAN LABEL
  // =====================================================

  function getPlanLabel() {

    if (subscriptionLoading) {

      return "Loading...";

    }


    if (!subscription) {

      return "Free";

    }


    if (
      subscription.status !== "active"
    ) {

      return "Free";

    }


    return subscription.plan;

  }


  // =====================================================
  // NORMALIZED PLAN
  // =====================================================

  function getNormalizedPlan() {

    return getPlanLabel()
      .trim()
      .toLowerCase();

  }


  // =====================================================
  // PLAN CHECKS
  // =====================================================

  function isFreePlan() {

    return (
      !subscriptionLoading &&
      getNormalizedPlan() === "free"
    );

  }


  function isProPlan() {

    return (
      !subscriptionLoading &&
      getNormalizedPlan() === "pro"
    );

  }


  function isPremiumPlan() {

    return (
      !subscriptionLoading &&
      getNormalizedPlan() === "premium"
    );

  }


  // =====================================================
  // FORMAT EXPIRY DATE
  // =====================================================

  function formatExpiryDate(
    date: string | null
  ) {

    if (!date) {

      return "No expiry";

    }


    const parsedDate =
      new Date(date);


    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {

      return "Unknown";

    }


    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  }


  // =====================================================
  // SEARCH NAVIGATION
  // =====================================================

  function handleSearchSelect(
    path: string
  ) {

    setSearch("");

    setShowSearchResults(
      false
    );

    navigate(path);

  }


  // =====================================================
  // UPGRADE
  // =====================================================

  function handleUpgrade(
    plan: UpgradePlan
  ) {

    setShowProfile(false);

    setShowNotifications(false);

    /*
      The pricing page can read:

      ?plan=pro

      or

      ?plan=premium
    */

    navigate(
      `/pricing?plan=${plan}`
    );

  }


  // =====================================================
  // LOGOUT
  // =====================================================

  function handleLogout() {

    setShowProfile(false);

    setShowNotifications(false);

    logout();

    navigate("/login");

  }


  // =====================================================
  // RETURN
  // =====================================================

  return (

    <header className="topbar">


      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="search-container">

        <div className="search-box">

          <Search
            size={18}
          />

          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(event) => {

              setSearch(
                event.target.value
              );

              setShowSearchResults(
                true
              );

            }}
            onFocus={() => {

              if (search.trim()) {

                setShowSearchResults(
                  true
                );

              }

            }}
          />


          {search && (

            <button
              type="button"
              className="search-clear"
              onClick={() => {

                setSearch("");

                setShowSearchResults(
                  false
                );

              }}
              aria-label="Clear search"
            >

              <X size={16} />

            </button>

          )}

        </div>


        {/* =================================================
            SEARCH RESULTS
        ================================================= */}

        {showSearchResults &&
          search.trim() !== "" && (

            <div className="search-results">

              {filteredSearchItems.length >
              0 ? (

                filteredSearchItems.map(
                  (item) => (

                    <button
                      type="button"
                      key={item.path}
                      onClick={() =>
                        handleSearchSelect(
                          item.path
                        )
                      }
                    >

                      <Search
                        size={16}
                      />

                      <span>
                        {item.name}
                      </span>

                    </button>

                  )
                )

              ) : (

                <div className="no-search-results">

                  No results found

                </div>

              )}

            </div>

          )}

      </div>


      {/* =================================================
          RIGHT SIDE
      ================================================= */}

      <div className="topbar-right">


        {/* =================================================
            NOTIFICATIONS
        ================================================= */}

        <div className="topbar-action-wrapper">

          <button
            type="button"
            className="icon-btn"
            onClick={() => {

              setShowNotifications(
                !showNotifications
              );

              setShowProfile(
                false
              );

            }}
            aria-label="Notifications"
          >

            <Bell
              size={20}
            />

            <span
              className="notification-dot"
            />

          </button>


          {showNotifications && (

            <div
              className="topbar-dropdown notification-dropdown"
            >

              <div className="dropdown-header">

                <h4>
                  Notifications
                </h4>


                <button
                  type="button"
                  onClick={() =>
                    setShowNotifications(
                      false
                    )
                  }
                  aria-label="Close notifications"
                >

                  <X
                    size={16}
                  />

                </button>

              </div>


              <div className="notification-item">

                <div className="notification-icon">

                  <CreditCard
                    size={18}
                  />

                </div>


                <div>

                  <strong>
                    {getPlanLabel()} Plan
                  </strong>


                  <p>

                    Your subscription is{" "}

                    {subscription?.status ||
                      "active"}.

                  </p>

                </div>

              </div>


              {/* =================================================
                  FREE → PRO / PREMIUM
              ================================================= */}

              {isFreePlan() && (

                <div className="notification-upgrade-options">

                  <button
                    type="button"
                    className="notification-upgrade-button"
                    onClick={() =>
                      handleUpgrade("pro")
                    }
                  >

                    <CreditCard
                      size={16}
                    />

                    Upgrade to Pro

                  </button>


                  <button
                    type="button"
                    className="notification-upgrade-button premium-button"
                    onClick={() =>
                      handleUpgrade("premium")
                    }
                  >

                    <CreditCard
                      size={16}
                    />

                    Upgrade to Premium

                  </button>

                </div>

              )}


              {/* =================================================
                  PRO → PREMIUM
              ================================================= */}

              {isProPlan() && (

                <button
                  type="button"
                  className="notification-upgrade-button premium-button"
                  onClick={() =>
                    handleUpgrade("premium")
                  }
                >

                  <CreditCard
                    size={16}
                  />

                  Upgrade to Premium

                </button>

              )}

            </div>

          )}

        </div>


        {/* =================================================
            PROFILE
        ================================================= */}

        <div className="profile-wrapper">

          <button
            type="button"
            className="profile"
            onClick={() => {

              setShowProfile(
                !showProfile
              );

              setShowNotifications(
                false
              );

            }}
          >

            <UserCircle
              size={36}
            />


            <div>

              <h4>

                {user?.full_name ||
                  "User"}

              </h4>


              <span>

                {getPlanLabel()} Plan

              </span>

            </div>

          </button>


          {/* =================================================
              PROFILE DROPDOWN
          ================================================= */}

          {showProfile && (

            <div
              className="topbar-dropdown profile-dropdown"
            >


              {/* =================================================
                  USER
              ================================================= */}

              <div
                className="profile-dropdown-user"
              >

                <UserCircle
                  size={42}
                />


                <div>

                  <strong>

                    {user?.full_name ||
                      "User"}

                  </strong>


                  <span>

                    {user?.email ||
                      ""}

                  </span>

                </div>

              </div>


              <div
                className="dropdown-divider"
              />


              {/* =================================================
                  SUBSCRIPTION
              ================================================= */}

              <div
                className="subscription-info"
              >

                <div
                  className="subscription-row"
                >

                  <span>
                    Current Plan
                  </span>


                  <strong>

                    {getPlanLabel()}

                  </strong>

                </div>


                <div
                  className="subscription-row"
                >

                  <span>
                    Status
                  </span>


                  <strong
                    className={
                      subscription?.status ===
                      "active"
                        ? "status-active"
                        : ""
                    }
                  >

                    {subscription?.status ||
                      "inactive"}

                  </strong>

                </div>


                {subscription?.expires_at && (

                  <div
                    className="subscription-row"
                  >

                    <span>
                      Expires
                    </span>


                    <strong>

                      {formatExpiryDate(
                        subscription.expires_at
                      )}

                    </strong>

                  </div>

                )}


                {/* =================================================
                    FREE PLAN
                ================================================= */}

                {isFreePlan() && (

                  <div className="upgrade-options">

                    <button
                      type="button"
                      className="upgrade-plan-button"
                      onClick={() =>
                        handleUpgrade("pro")
                      }
                    >

                      <CreditCard
                        size={17}
                      />

                      Upgrade to Pro

                    </button>


                    <button
                      type="button"
                      className="upgrade-plan-button premium-upgrade"
                      onClick={() =>
                        handleUpgrade("premium")
                      }
                    >

                      <CreditCard
                        size={17}
                      />

                      Upgrade to Premium

                    </button>

                  </div>

                )}


                {/* =================================================
                    PRO PLAN
                ================================================= */}

                {isProPlan() && (

                  <button
                    type="button"
                    className="upgrade-plan-button premium-upgrade"
                    onClick={() =>
                      handleUpgrade("premium")
                    }
                  >

                    <CreditCard
                      size={17}
                    />

                    Upgrade to Premium

                  </button>

                )}


                {/* =================================================
                    PREMIUM PLAN
                ================================================= */}

                {isPremiumPlan() && (

                  <div className="premium-active">

                    <span className="premium-check">
                      ✓
                    </span>

                    You are on the highest plan

                  </div>

                )}

              </div>


              <div
                className="dropdown-divider"
              />


              {/* =================================================
                  SETTINGS
              ================================================= */}

              <button
                type="button"
                className="dropdown-menu-button"
                onClick={() => {

                  setShowProfile(
                    false
                  );

                  navigate(
                    "/settings"
                  );

                }}
              >

                Settings

              </button>


              {/* =================================================
                  LOGOUT
              ================================================= */}

              <button
                type="button"
                className="dropdown-menu-button logout-menu-button"
                onClick={
                  handleLogout
                }
              >

                <LogOut
                  size={17}
                />

                Logout

              </button>

            </div>

          )}

        </div>

      </div>

    </header>

  );

}


export default Topbar;