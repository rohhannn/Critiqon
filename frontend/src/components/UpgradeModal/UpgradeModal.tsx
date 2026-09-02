import {
  X,
  Lock,
  Sparkles,
  Check,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  startPayment,
} from "../../services/payment";
import { notify } from "../../services/notifications";

import {
  useSubscription,
} from "../../context/SubscriptionContext";

import "./UpgradeModal.css";


interface Props {

  requiredPlan:
    | "Pro"
    | "Premium";

  featureName: string;

  onClose: () => void;

}


function UpgradeModal({
  requiredPlan,
  featureName,
  onClose,
}: Props) {

  const navigate =
    useNavigate();


  const {
    refreshSubscription,
  } =
    useSubscription();


  const [
    paying,
    setPaying,
  ] =
    useState(false);


  async function handleUpgrade() {

    try {

      setPaying(true);


      await startPayment(
        requiredPlan,
        async () => {

          await refreshSubscription();

          onClose();

        }
      );

    } catch (error) {

      console.error(
        "Upgrade error:",
        error
      );


      notify({ type: "error", title: "Payment unavailable", message: error instanceof Error ? error.message : "Unable to start payment." });

    } finally {

      setPaying(false);

    }

  }


  function viewPlans() {

    onClose();

    navigate("/pricing");

  }


  const isPremium =
    requiredPlan === "Premium";


  return (

    <div
      className="upgrade-overlay"
      onClick={onClose}
    >

      <div
        className="upgrade-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        {/* CLOSE */}

        <button
          type="button"
          className="upgrade-close"
          onClick={onClose}
        >

          <X size={20} />

        </button>


        {/* ICON */}

        <div className="upgrade-icon">

          {isPremium ? (
            <Sparkles size={28} />
          ) : (
            <Lock size={28} />
          )}

        </div>


        {/* TITLE */}

        <h2>
          {featureName} is a{" "}
          {requiredPlan} feature
        </h2>


        <p className="upgrade-description">

          Your current plan does not
          include this feature.

          Upgrade to{" "}
          <strong>
            {requiredPlan}
          </strong>{" "}
          to unlock it.

        </p>


        {/* FEATURES */}

        <div className="upgrade-benefits">

          <div>

            <Check size={17} />

            <span>
              Unlock {featureName}
            </span>

          </div>


          <div>

            <Check size={17} />

            <span>
              Keep all your existing features
            </span>

          </div>


          <div>

            <Check size={17} />

            <span>
              Instant access after payment
            </span>

          </div>

        </div>


        {/* BUTTONS */}

        <button
          type="button"
          className="upgrade-primary"
          onClick={handleUpgrade}
          disabled={paying}
        >

          {paying
            ? "Opening Payment..."
            : `Upgrade to ${requiredPlan}`}

        </button>


        <button
          type="button"
          className="upgrade-secondary"
          onClick={viewPlans}
          disabled={paying}
        >

          View All Plans

        </button>


        <button
          type="button"
          className="upgrade-cancel"
          onClick={onClose}
          disabled={paying}
        >

          Maybe Later

        </button>

      </div>

    </div>

  );

}


export default UpgradeModal;