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
} from "@mui/material";
import {
  School as SchoolIcon,
  ExitToApp as LogoutIcon,
} from "@mui/icons-material";

// ── Role-based nav items ──────────────────────────────────────────────────────
const NAV_BY_ROLE = {
  student: [
    { path: "/", label: "Home", exact: true },
    { path: "/my-risk", label: "My Risk" },
    { path: "/recommendation", label: "Recommendations" },
    { path: "/WorkloadDashboard", label: "Workload" },
    { path: "/announcements", label: "Announcements" },
  ],
  lecturer: [
    { path: "/", label: "Home", exact: true },
    { path: "/lecturer-risk", label: "Student Risks" },
    { path: "/announcements", label: "Announcements" },
    { path: "/admin/adminworkload", label: "Workload Tracker" },
  ],
  staff: [
    { path: "/", label: "Home", exact: true },
    { path: "/upload", label: "Upload PDFs" },
    { path: "/announcements", label: "Announcements" },
  ],
  admin: [
    { path: "/", label: "Home", exact: true },
    { path: "/admin/announcements", label: "Announcements" },
    { path: "/support", label: "Interventions" },
    { path: "/admin/adminworkload", label: "Workload" },
  ],
  super_admin: [
    { path: "/", label: "Home", exact: true },
    { path: "/gru", label: "GRU Model" },
    { path: "/rl", label: "RL Engine" },
    { path: "/admin/disengagementhub", label: "Disengagement" },
    { path: "/gru/batch", label: "GRU Batch" },
    { path: "/admin/announcements", label: "Announcements" },
  ],
};

const DEFAULT_NAV = [
  { path: "/", label: "Home", exact: true },
  { path: "/announcements", label: "Announcements" },
];

const NavigationBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userData, logout } = useAuth();

  const role = userData?.role || "";
  const navItems = NAV_BY_ROLE[role] || DEFAULT_NAV;

  const theme = {
    accent: "#60A5FA",
    textLight: "#CBD5E1",
    white: "#FFFFFF",
  };

  const isActive = (path, exact = false) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

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
    <>
      <style>{`
        @keyframes slideDownFade {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nav-animate-in { animation: slideDownFade 0.5s ease-out forwards; }
      `}</style>

      <AppBar
        position="sticky"
        elevation={0}
        className="nav-animate-in"
        sx={{
          background:
            "linear-gradient(to right, rgba(15,23,42,0.95), rgba(30,58,138,0.95))",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
          zIndex: 1100,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{ display: "flex", justifyContent: "space-between", py: 1 }}
          >
            {/* LEFT — Logo + Nav */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 2, lg: 5 },
              }}
            >
              {/* Logo */}
              <Box
                component={Link}
                to="/"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "white",
                  transition: "opacity 0.2s",
                  "&:hover": { opacity: 0.8 },
                }}
              >
                <SchoolIcon
                  sx={{
                    fontSize: 34,
                    mr: 1.5,
                    color: theme.accent,
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
                  }}
                />
                <Typography
                  fontWeight={800}
                  variant="h6"
                  sx={{ letterSpacing: "-0.02em", lineHeight: 1.1 }}
                >
                  AcademiGuard
                </Typography>
              </Box>

              {/* Nav links */}
              <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.5 }}>
                {navItems.map((item) => {
                  const active = isActive(item.path, item.exact);
                  return (
                    <Button
                      key={item.path}
                      component={Link}
                      to={item.path}
                      disableRipple
                      sx={{
                        color: active ? theme.accent : theme.textLight,
                        fontWeight: active ? 600 : 500,
                        textTransform: "none",
                        fontSize: "0.88rem",
                        letterSpacing: "0.01em",
                        padding: "6px 10px",
                        position: "relative",
                        transition: "color 0.2s",
                        "&:hover": {
                          color: theme.white,
                          backgroundColor: "transparent",
                        },
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          bottom: 0,
                          left: "50%",
                          transform: active
                            ? "translateX(-50%)"
                            : "translateX(-50%) scaleX(0)",
                          width: "18px",
                          height: "2px",
                          backgroundColor: theme.accent,
                          borderRadius: "2px",
                          transition: "transform 0.3s ease",
                        },
                        "&:hover::after": {
                          transform: "translateX(-50%) scaleX(1)",
                        },
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Box>
            </Box>

            {/* RIGHT — User badge + logout */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {currentUser && (
                <Box
                  sx={{
                    display: { xs: "none", sm: "flex" },
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  {/* Role pill */}
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.4,
                      borderRadius: "999px",
                      background: "rgba(96,165,250,0.15)",
                      border: "1px solid rgba(96,165,250,0.3)",
                    }}
                  >
                    <Typography
                      sx={{
                        color: theme.accent,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {role.toUpperCase().replace("_", " ")}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      width: "1px",
                      height: "18px",
                      backgroundColor: "rgba(255,255,255,0.15)",
                    }}
                  />

                  {/* Name */}
                  <Typography
                    sx={{
                      color: theme.white,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    {userData?.firstName || currentUser?.uid?.substring(0, 6)}
                  </Typography>
                </Box>
              )}

              {!currentUser ? (
                <Button
                  component={Link}
                  to="/login"
                  sx={{
                    color: "#0F172A",
                    backgroundColor: theme.white,
                    borderRadius: "8px",
                    fontWeight: 600,
                    textTransform: "none",
                    px: 3,
                    py: 0.8,
                    "&:hover": {
                      backgroundColor: "#F8FAFC",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  Sign In
                </Button>
              ) : (
                <Tooltip title="Sign Out" arrow>
                  <IconButton
                    onClick={handleLogout}
                    sx={{
                      color: theme.textLight,
                      transition: "all 0.2s",
                      "&:hover": {
                        color: "#F87171",
                        backgroundColor: "rgba(248,113,113,0.1)",
                      },
                    }}
                  >
                    <LogoutIcon sx={{ fontSize: "1.2rem" }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </>
  );
};

export default NavigationBar;
