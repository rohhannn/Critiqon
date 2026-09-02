import "./Navbar.css";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    logout,
  } = useAuth();


  const scrollToSection = (id: string) => {

    /* -----------------------------------------------
       ALREADY ON HOME
    ------------------------------------------------ */

    if (location.pathname === "/") {

      if (id === "home") {

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      const section =
        document.getElementById(id);

      if (section) {

        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

      }

      return;
    }


    /* -----------------------------------------------
       COMING FROM ANOTHER PAGE
    ------------------------------------------------ */

    navigate(`/#${id}`);


    /*
      React needs a moment to render Home before
      the target element exists.
    */

    window.setTimeout(() => {

      if (id === "home") {

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      const section =
        document.getElementById(id);

      if (section) {

        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

      }

    }, 80);
  };


  const handleLogin = () => {
    navigate("/login");
  };


  const handleDashboard = () => {
    navigate("/dashboard");
  };


  const handleLogout = () => {
    logout();
    navigate("/");
  };


  return (
    <nav className="navbar">

      {/* LOGO */}

      <button
        type="button"
        className="navbar-logo"
        onClick={() =>
          scrollToSection("home")
        }
        aria-label="Critiqon Home"
      >
        Critiqon
      </button>


      {/* NAVIGATION */}

      <div className="navbar-links">

        <button
          type="button"
          onClick={() =>
            scrollToSection("home")
          }
        >
          Home
        </button>


        <button
          type="button"
          onClick={() =>
            scrollToSection("features")
          }
        >
          Features
        </button>


        <button
          type="button"
          onClick={() =>
            scrollToSection("pricing")
          }
        >
          Pricing
        </button>


        <button
          type="button"
          onClick={() =>
            scrollToSection("about")
          }
        >
          About
        </button>


        {user ? (
          <>
            <button
              type="button"
              className="navbar-login"
              onClick={handleDashboard}
            >
              Dashboard
            </button>

            <button
              type="button"
              className="navbar-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <button
            type="button"
            className="navbar-login"
            onClick={handleLogin}
          >
            Login
          </button>
        )}

      </div>

    </nav>
  );
}

export default Navbar;