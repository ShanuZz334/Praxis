import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import axiosInstance from "../utils/axiosinstance";

export const UserContext = createContext(null);

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /* -------------------------------------------
     LOAD USER + TOKEN FROM LOCALSTORAGE (SAFE)
  -------------------------------------------- */
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (err) {
      console.error("Corrupted auth data. Clearing storage.");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /* -------------------------------------------
     SYNC TOKEN WITH AXIOS INSTANCE
  -------------------------------------------- */
  useEffect(() => {
    if (token) {
      axiosInstance.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      delete axiosInstance.defaults.headers.Authorization;
    }
  }, [token]);

  /* -------------------------------------------
     UPDATE USER + TOKEN
  -------------------------------------------- */
  const updateUser = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", jwtToken);
  };

  /* -------------------------------------------
     CLEAR AUTH (LOGOUT)
  -------------------------------------------- */
  const clearUser = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    delete axiosInstance.defaults.headers.Authorization;
  };

  /* -------------------------------------------
     MEMOIZED CONTEXT VALUE (PERFORMANCE)
  -------------------------------------------- */
  const contextValue = useMemo(
    () => ({
      user,
      token,
      loading,
      updateUser,
      clearUser,
    }),
    [user, token, loading]
  );

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
