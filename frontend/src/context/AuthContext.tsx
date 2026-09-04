import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";


/*
|--------------------------------------------------------------------------
| USER
|--------------------------------------------------------------------------
*/

export interface User {
  id: number;

  full_name: string;

  email: string;
}


/*
|--------------------------------------------------------------------------
| AUTH CONTEXT
|--------------------------------------------------------------------------
*/

interface AuthContextType {

  user: User | null;

  token: string | null;

  loading: boolean;

  login: (
    token: string,
    user: User,
  ) => void;

  logout: () => void;
}


/*
|--------------------------------------------------------------------------
| CONTEXT
|--------------------------------------------------------------------------
*/

const AuthContext =
  createContext<
    AuthContextType | undefined
  >(undefined);


/*
|--------------------------------------------------------------------------
| READ STORED SESSION
|--------------------------------------------------------------------------
*/

function readStoredSession(): {
  token: string | null;

  user: User | null;
} {

  try {

    const token =
      sessionStorage.getItem(
        "token",
      );

    const rawUser =
      sessionStorage.getItem(
        "user",
      );


    /*
    |--------------------------------------------------------------------------
    | No session
    |--------------------------------------------------------------------------
    */

    if (
      !token ||
      !rawUser
    ) {

      return {
        token: null,
        user: null,
      };

    }


    /*
    |--------------------------------------------------------------------------
    | Parse user
    |--------------------------------------------------------------------------
    */

    const user =
      JSON.parse(
        rawUser,
      ) as User;


    /*
    |--------------------------------------------------------------------------
    | Validate stored user
    |--------------------------------------------------------------------------
    */

    if (
      !user ||
      !user.id ||
      !user.email
    ) {

      throw new Error(
        "Invalid stored user",
      );

    }


    return {
      token,
      user,
    };

  } catch {

    /*
    |--------------------------------------------------------------------------
    | Remove corrupt session
    |--------------------------------------------------------------------------
    */

    sessionStorage.removeItem(
      "token",
    );

    sessionStorage.removeItem(
      "user",
    );


    return {
      token: null,
      user: null,
    };

  }
}


/*
|--------------------------------------------------------------------------
| AUTH PROVIDER
|--------------------------------------------------------------------------
*/

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {

  /*
  |--------------------------------------------------------------------------
  | Initial session
  |--------------------------------------------------------------------------
  */

  const initial =
    useMemo(
      () =>
        readStoredSession(),
      [],
    );


  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [
    user,
    setUser,
  ] =
    useState<User | null>(
      initial.user,
    );


  const [
    token,
    setToken,
  ] =
    useState<string | null>(
      initial.token,
    );


  /*
  |--------------------------------------------------------------------------
  | SESSION EXPIRATION
  |--------------------------------------------------------------------------
  |
  | api.ts dispatches:
  |
  | critiqon:session-expired
  |
  */

  useEffect(() => {

    function handleSessionExpired() {

      sessionStorage.removeItem(
        "token",
      );

      sessionStorage.removeItem(
        "user",
      );


      setToken(null);

      setUser(null);

    }


    window.addEventListener(
      "critiqon:session-expired",
      handleSessionExpired,
    );


    return () => {

      window.removeEventListener(
        "critiqon:session-expired",
        handleSessionExpired,
      );

    };

  }, []);


  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  */

  function login(
    nextToken: string,
    nextUser: User,
  ) {

    /*
    |--------------------------------------------------------------------------
    | Session storage
    |--------------------------------------------------------------------------
    */

    sessionStorage.setItem(
      "token",
      nextToken,
    );

    sessionStorage.setItem(
      "user",
      JSON.stringify(
        nextUser,
      ),
    );


    /*
    |--------------------------------------------------------------------------
    | React state
    |--------------------------------------------------------------------------
    */

    setToken(
      nextToken,
    );

    setUser(
      nextUser,
    );

  }


  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  function logout() {

    /*
    |--------------------------------------------------------------------------
    | Session storage
    |--------------------------------------------------------------------------
    */

    sessionStorage.removeItem(
      "token",
    );

    sessionStorage.removeItem(
      "user",
    );


    /*
    |--------------------------------------------------------------------------
    | Legacy local storage cleanup
    |--------------------------------------------------------------------------
    */

    localStorage.removeItem(
      "token",
    );

    localStorage.removeItem(
      "user",
    );

    localStorage.removeItem(
      "pendingPlan",
    );


    /*
    |--------------------------------------------------------------------------
    | React state
    |--------------------------------------------------------------------------
    */

    setToken(null);

    setUser(null);

  }


  /*
  |--------------------------------------------------------------------------
  | CONTEXT VALUE
  |--------------------------------------------------------------------------
  */

  const value =
    useMemo(
      () => ({
        user,

        token,

        loading: false,

        login,

        logout,
      }),
      [
        user,
        token,
      ],
    );


  /*
  |--------------------------------------------------------------------------
  | PROVIDER
  |--------------------------------------------------------------------------
  */

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}


/*
|--------------------------------------------------------------------------
| USE AUTH
|--------------------------------------------------------------------------
*/

export function useAuth() {

  const context =
    useContext(
      AuthContext,
    );


  if (!context) {

    throw new Error(
      "useAuth must be used inside AuthProvider",
    );

  }


  return context;
}