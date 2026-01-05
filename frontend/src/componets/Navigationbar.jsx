// components/NavigationBar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
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

  // Theme colors
  const theme = {
    primary: "#1A237E",
    primaryLight: "#E8EAF6",
    primaryDark: "#0D47A1",
    secondary: "#283593",
    accent: "#303F9F",
  };

  // Navigation items
  const navItems = [
    {
      path: "/",
      label: "Home",
      icon: <HomeIcon />,
      exact: true,
    },
    {
      path: "/risk",
      label: "Risk Demo",
      icon: <RiskIcon />,
    },
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
      // show bell emoji as the icon
      icon: <span style={{ fontSize: 18 }}>🔔</span>,
      iconOnly: true,
    },
    {
      path: "/create-quiz",
      label: "Create Quiz",
      icon: <CreateIcon />,
    },
    {
      path: "/levels",
      label: "Quizzes",
      icon: <DashboardIcon />,
    },
    {
      path: "/analytics",
      label: "Analytics",
      icon: <AnalyticsIcon />,
    },
    {
      path: "/profile",
      label: "Profile",
      icon: <ProfileIcon />,
    },
  ];

  // Check if current path matches nav item
  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
        borderBottom: `2px solid ${theme.primaryLight}`,
        boxShadow: "0 4px 20px rgba(26, 35, 126, 0.3)",
      }}
    >
      <Container maxWidth="xl">
        <Toolbar
          sx={{
            px: { xs: 1, md: 2 },
            py: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Left side - Logo and main navigation */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            {/* Logo */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                color: "inherit",
                mr: 2,
              }}
              component={Link}
              to="/"
            >
              <SchoolIcon
                sx={{
                  fontSize: 36,
                  mr: 1.5,
                  color: "white",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                }}
              />
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: "white",
                    background: "linear-gradient(90deg, #FFFFFF, #E3F2FD)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    letterSpacing: "0.5px",
                    lineHeight: 1.2,
                  }}
                >
                  QuizMaster Pro
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "0.7rem",
                    fontWeight: 500,
                    letterSpacing: "1px",
                  }}
                >
                  LEARNING PLATFORM
                </Typography>
              </Box>
            </Box>

            {/* Main Navigation Links */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                gap: 0.5,
                alignItems: "center",
              }}
            >
              {navItems.slice(0, 5).map((item) => (
                <Tooltip key={item.path} title={item.label} arrow>
                  <Button
                    component={Link}
                    to={item.path}
                    startIcon={item.icon}
                    sx={{
                      color: isActive(item.path, item.exact)
                        ? "#FFD700"
                        : "white",
                      fontWeight: isActive(item.path, item.exact) ? 700 : 600,
                      backgroundColor: isActive(item.path, item.exact)
                        ? "rgba(255, 215, 0, 0.1)"
                        : "transparent",
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      minWidth: "auto",
                      "&:hover": {
                        backgroundColor: isActive(item.path, item.exact)
                          ? "rgba(255, 215, 0, 0.2)"
                          : "rgba(255, 255, 255, 0.15)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      },
                      transition: "all 0.3s ease",
                      border: isActive(item.path, item.exact)
                        ? "1px solid rgba(255, 215, 0, 0.3)"
                        : "1px solid transparent",
                    }}
                  >
                    {!item.iconOnly && (
                      <Typography variant="button" sx={{ fontSize: "0.8rem" }}>
                        {item.label}
                      </Typography>
                    )}
                  </Button>
                </Tooltip>
              ))}
            </Box>
          </Box>

          {/* Right side - User info and additional actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* User info */}
            <Chip
              icon={<ProfileIcon />}
              label="Student 002"
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                fontWeight: 600,
                "& .MuiChip-icon": {
                  color: "white",
                },
              }}
            />

            {/* Additional navigation for mobile */}
            <Box sx={{ display: { xs: "flex", md: "none" }, gap: 1 }}>
              <Tooltip title="Menu">
                <IconButton
                  component={Link}
                  to="/levels"
                  sx={{
                    color: "white",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                    },
                  }}
                >
                  <DashboardIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Toolbar>

        {/* Mobile Navigation Bar */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            justifyContent: "center",
            py: 1,
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            backgroundColor: "rgba(0, 0, 0, 0.1)",
          }}
        >
          <Box sx={{ display: "flex", gap: 1, overflowX: "auto", px: 1 }}>
            {navItems.slice(1, 5).map((item) => (
              <Chip
                key={item.path}
                icon={item.icon}
                label={item.label}
                component={Link}
                to={item.path}
                clickable
                sx={{
                  backgroundColor: isActive(item.path)
                    ? "rgba(255, 215, 0, 0.2)"
                    : "rgba(255, 255, 255, 0.1)",
                  color: isActive(item.path) ? "#FFD700" : "white",
                  fontWeight: 600,
                  "& .MuiChip-icon": {
                    color: isActive(item.path) ? "#FFD700" : "white",
                  },
                  "&:hover": {
                    backgroundColor: isActive(item.path)
                      ? "rgba(255, 215, 0, 0.3)"
                      : "rgba(255, 255, 255, 0.2)",
                  },
                }}
                size="small"
              />
            ))}
          </Box>
        </Box>
      </Container>
    </AppBar>
  );
};

export default NavigationBar;
