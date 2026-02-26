import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  AppBar,
  Toolbar,
  Container,
  Typography,
  Box,
  Button,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";

import {
  School as SchoolIcon,
  TrendingUp as RiskIcon,
  Recommend as RecommendIcon,
  AddCircle as CreateIcon,
  Dashboard as DashboardIcon,
  Home as HomeIcon,
  Person as ProfileIcon,
  ExitToApp as LogoutIcon,
} from "@mui/icons-material";

const NavigationBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ IMPORTANT: remembers login state
  const { currentUser, userData, logout } = useAuth();

  const theme = {
    primary: "#1A237E",
    primaryLight: "#E8EAF6",
    secondary: "#283593",
  };

  const navItems = [
    { path: "/", label: "Home", icon: <HomeIcon />, exact: true },
    { path: "/risk", label: "Risk Dashboard", icon: <RiskIcon /> },
    {
      path: "/recommendation",
      label: "Recommendation",
      icon: <RecommendIcon />,
    },
    {
      path: "/announcements",
      label: "Announcements",
      icon: <span>🔔</span>,
      iconOnly: true,
    },
    { path: "/create-quiz", label: "Create Quiz", icon: <CreateIcon /> },
    { path: "/levels", label: "Quizzes", icon: <DashboardIcon /> },
  ];

  const isActive = (path, exact = false) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  // ✅ Logout handler
  const handleLogout = async () => {
    try {
      await logout();
      localStorage.clear();
      sessionStorage.clear();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
        borderBottom: `2px solid ${theme.primaryLight}`,
        boxShadow: "0 4px 20px rgba(26,35,126,0.3)",
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* LEFT SIDE */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            {/* LOGO */}
            <Box
              component={Link}
              to="/"
              sx={{
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                color: "white",
              }}
            >
              <SchoolIcon sx={{ fontSize: 36, mr: 1 }} />
              <Box>
                <Typography fontWeight={800} variant="h6">
                  AcademiGuard
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  LEARNING PLATFORM
                </Typography>
              </Box>
            </Box>

            {/* NAV LINKS */}
            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
              {navItems.map((item) => (
                <Tooltip key={item.path} title={item.label}>
                  <Button
                    component={Link}
                    to={item.path}
                    startIcon={item.icon}
                    sx={{
                      color: isActive(item.path, item.exact)
                        ? "#FFD700"
                        : "white",
                      fontWeight: isActive(item.path, item.exact) ? 700 : 500,
                      backgroundColor: isActive(item.path, item.exact)
                        ? "rgba(255,215,0,0.12)"
                        : "transparent",
                    }}
                  >
                    {!item.iconOnly && item.label}
                  </Button>
                </Tooltip>
              ))}
            </Box>
          </Box>

          {/* RIGHT SIDE */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* USER BADGE */}
            {currentUser && (
              <Chip
                icon={<ProfileIcon />}
                label={`${userData?.role?.toUpperCase() || "USER"} • ${currentUser?.uid || ""}`}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: 600,
                }}
              />
            )}

            {/* LOGIN / LOGOUT BUTTON */}
            {!currentUser ? (
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                sx={{
                  color: "white",
                  borderColor: "white",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
                }}
              >
                Login
              </Button>
            ) : (
              <Tooltip title="Logout">
                <IconButton
                  onClick={handleLogout}
                  sx={{
                    color: "white",
                    backgroundColor: "rgba(255,255,255,0.15)",
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" },
                  }}
                >
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default NavigationBar;
