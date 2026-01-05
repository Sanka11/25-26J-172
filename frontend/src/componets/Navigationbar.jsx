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
  BarChart as AnalyticsIcon,
  Person as ProfileIcon,
  ExitToApp as LogoutIcon,
} from "@mui/icons-material";

const NavigationBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // ✅ AUTH HOOK

  // Theme colors
  const theme = {
    primary: "#1A237E",
    primaryLight: "#E8EAF6",
    secondary: "#283593",
  };

  // Navigation items
  const navItems = [
    { path: "/", label: "Home", icon: <HomeIcon />, exact: true },
    { path: "/risk", label: "Risk Demo", icon: <RiskIcon /> },
    {
      path: "/recommendation",
      label: "Recommendation Demo",
      icon: <RecommendIcon />,
    },
    {
      path: "/admin/announcements",
      label: "Manage Announcements",
      icon: <DashboardIcon />,
    },
    {
      path: "/announcements",
      label: "Announcements",
      icon: <span style={{ fontSize: 18 }}>🔔</span>,
      iconOnly: true,
    },
  ];

  const isActive = (path, exact = false) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
        borderBottom: `2px solid ${theme.primaryLight}`,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* LEFT */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Box
              component={Link}
              to="/"
              sx={{
                display: "flex",
                alignItems: "center",
                color: "white",
                textDecoration: "none",
              }}
            >
              <SchoolIcon sx={{ fontSize: 36, mr: 1 }} />
              <Typography variant="h6" fontWeight={700}>
                AcademiGuard
              </Typography>
            </Box>

            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    color: isActive(item.path, item.exact)
                      ? "#FFD700"
                      : "white",
                    fontWeight: isActive(item.path, item.exact) ? 700 : 500,
                  }}
                >
                  {!item.iconOnly && item.label}
                </Button>
              ))}
            </Box>
          </Box>

          {/* RIGHT */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {user && (
              <Chip
                icon={<ProfileIcon />}
                label={`${user.role.toUpperCase()} • ${user.id}`}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: 600,
                }}
              />
            )}

            {/* LOGOUT BUTTON */}
            {user && (
              <Tooltip title="Logout">
                <IconButton
                  onClick={handleLogout}
                  sx={{
                    color: "white",
                    backgroundColor: "rgba(255,255,255,0.15)",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.3)",
                    },
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
