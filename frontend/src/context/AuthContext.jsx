import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Restore session on refresh
  useEffect(() => {
    const stored = localStorage.getItem("academiguard_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const login = ({ id, role }) => {
    const userData = { id, role };
    localStorage.setItem("academiguard_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("academiguard_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
