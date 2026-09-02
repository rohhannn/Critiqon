import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";

import api from "../services/api";

import { useAuth } from "./AuthContext";


export type Plan =
  | "Free"
  | "Pro"
  | "Premium";


interface SubscriptionData {
  plan: string;
  status: string;
  started_at: string | null;
  expires_at: string | null;
}


interface SubscriptionContextType {

  plan: Plan;

  status: string;

  expiresAt: string | null;

  loading: boolean;

  hasAccess: (
    requiredPlan: Plan
  ) => boolean;

  refreshSubscription: () => Promise<Plan>;

}


const SubscriptionContext =
  createContext<
    SubscriptionContextType | undefined
  >(undefined);


interface Props {
  children: ReactNode;
}


// =========================================================
// NORMALIZE PLAN
// =========================================================

function normalizePlan(
  plan: string | undefined
): Plan {

  if (plan === "Premium") {
    return "Premium";
  }

  if (plan === "Pro") {
    return "Pro";
  }

  return "Free";
}


// =========================================================
// PLAN LEVEL
// =========================================================

function planLevel(
  plan: Plan
): number {

  switch (plan) {

    case "Premium":
      return 3;

    case "Pro":
      return 2;

    case "Free":
    default:
      return 1;

  }

}


// =========================================================
// PROVIDER
// =========================================================

export function SubscriptionProvider({
  children,
}: Props) {

  const {
    token,
    loading: authLoading,
  } = useAuth();


  const [
    plan,
    setPlan,
  ] =
    useState<Plan>("Free");


  const [
    status,
    setStatus,
  ] =
    useState("inactive");


  const [
    expiresAt,
    setExpiresAt,
  ] =
    useState<string | null>(
      null
    );


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  // =======================================================
  // LOAD SUBSCRIPTION
  // =======================================================

  const refreshSubscription =
    useCallback(
      async (): Promise<Plan> => {

        if (!token) {

          setPlan("Free");

          setStatus("inactive");

          setExpiresAt(null);

          setLoading(false);

          return "Free";

        }


        try {

          setLoading(true);


          const response =
            await api.get<SubscriptionData>(
              "/payments/subscription"
            );


          const normalizedPlan =
            normalizePlan(
              response.data.plan
            );


          /*
           * Backend is the source of truth.
           *
           * Only an active subscription
           * can unlock a paid plan.
           */

          const effectivePlan: Plan =
            response.data.status === "active"
              ? normalizedPlan
              : "Free";

          setPlan(effectivePlan);


          setStatus(
            response.data.status
          );


          setExpiresAt(
            response.data.expires_at
          );

          return effectivePlan;

        } catch (error) {

          console.error(
            "Failed to load subscription:",
            error
          );


          /*
           * Fail closed.
           *
           * If subscription information
           * cannot be loaded, user gets
           * Free-level access.
           */

          setPlan("Free");

          setStatus("inactive");

          setExpiresAt(null);

          return "Free";

        } finally {

          setLoading(false);

        }

      },
      [token]
    );


  // =======================================================
  // REFRESH WHEN AUTHENTICATION CHANGES
  // =======================================================

  useEffect(() => {

    if (authLoading) {
      return;
    }


    const task = window.setTimeout(() => {
      void refreshSubscription();
    }, 0);

    return () => window.clearTimeout(task);

  }, [
    authLoading,
    refreshSubscription,
  ]);


  // =======================================================
  // ACCESS CHECK
  // =======================================================

  function hasAccess(
    requiredPlan: Plan
  ): boolean {

    return (
      planLevel(plan) >=
      planLevel(requiredPlan)
    );

  }


  // =======================================================
  // PROVIDER
  // =======================================================

  return (

    <SubscriptionContext.Provider
      value={{

        plan,

        status,

        expiresAt,

        loading,

        hasAccess,

        refreshSubscription,

      }}
    >

      {children}

    </SubscriptionContext.Provider>

  );

}


// =========================================================
// HOOK
// =========================================================

export function useSubscription() {

  const context =
    useContext(
      SubscriptionContext
    );


  if (!context) {

    throw new Error(
      "useSubscription must be used inside SubscriptionProvider"
    );

  }


  return context;

}