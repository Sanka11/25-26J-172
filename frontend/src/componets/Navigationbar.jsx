// import React from "react";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

// import {
//   AppBar,
//   Toolbar,
//   Container,
//   Typography,
//   Box,
//   Button,
//   IconButton,
//   Tooltip,
//   Chip,
// } from "@mui/material";

// import {
//   School as SchoolIcon,
//   TrendingUp as RiskIcon,
//   Recommend as RecommendIcon,
//   AddCircle as CreateIcon,
//   Dashboard as DashboardIcon,
//   Home as HomeIcon,
//   Person as ProfileIcon,
//   ExitToApp as LogoutIcon,
//   NotificationsActive as AlertIcon,
// } from "@mui/icons-material";

// const NavigationBar = () => {
//   const location = useLocation();
//   const navigate = useNavigate();

//   // ✅ IMPORTANT: remembers login state
//   const { currentUser, userData, logout } = useAuth();

//   const theme = {
//     primary: "#1A237E",
//     primaryLight: "#E8EAF6",
//     secondary: "#283593",
//     accent: "#FFD700",
//   };

//   const navItems = [
//     { path: "/", label: "Home", icon: <HomeIcon />, exact: true },
//     { path: "/risk", label: "Risk Dashboard", icon: <RiskIcon /> },
//     {
//       path: "/recommendation",
//       label: "Recommendation",
//       icon: <RecommendIcon />,
//     },
//     {
//       path: "/announcements",
//       label: "Announcements",
//       icon: <AlertIcon />,
//       iconOnly: true,
//     },
//     // { path: "/create-quiz", label: "Create Quiz", icon: <CreateIcon /> },
//     { path: "/levels", label: "Quizzes", icon: <DashboardIcon /> },
//     {
//       path: "/WorkloadDashboard",
//       label: "WorkloadDashboard",
//       icon: <DashboardIcon />,
//     },
//   ];

//   const isActive = (path, exact = false) =>
//     exact ? location.pathname === path : location.pathname.startsWith(path);

//   // ✅ Logout handler
//   const handleLogout = async () => {
//     try {
//       await logout();
//       localStorage.clear();
//       sessionStorage.clear();
//       navigate("/login", { replace: true });
//     } catch (err) {
//       console.error("Logout failed:", err);
//     }
//   };

//   return (
//     <>
//       {/* Custom Keyframes for smooth entry and pulses */}
//       <style>{`
//         @keyframes slideDownFade {
//           from { opacity: 0; transform: translateY(-20px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         @keyframes float {
//           0% { transform: translateY(0px); }
//           50% { transform: translateY(-3px); }
//           100% { transform: translateY(0px); }
//         }
//         .nav-animate-in {
//           animation: slideDownFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
//         }
//       `}</style>

//       <AppBar
//         position="sticky"
//         elevation={0}
//         className="nav-animate-in"
//         sx={{
//           background: `linear-gradient(135deg, rgba(26, 35, 126, 0.95), rgba(40, 53, 147, 0.95))`,
//           backdropFilter: "blur(12px)",
//           WebkitBackdropFilter: "blur(12px)", // Safari support
//           borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
//           boxShadow: "0 10px 30px -10px rgba(26,35,126,0.5)",
//           zIndex: 1100,
//         }}
//       >
//         <Container maxWidth="xl">
//           <Toolbar
//             sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}
//           >
//             {/* LEFT SIDE */}
//             <Box
//               sx={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: { xs: 2, lg: 4 },
//               }}
//             >
//               {/* LOGO */}
//               <Box
//                 component={Link}
//                 to="/"
//                 sx={{
//                   display: "flex",
//                   alignItems: "center",
//                   textDecoration: "none",
//                   color: "white",
//                   transition: "transform 0.3s ease",
//                   "&:hover": {
//                     transform: "scale(1.02)",
//                   },
//                   "&:hover .logo-icon": {
//                     animation: "float 2s ease-in-out infinite",
//                     color: theme.accent,
//                   },
//                 }}
//               >
//                 <SchoolIcon
//                   className="logo-icon"
//                   sx={{
//                     fontSize: 40,
//                     mr: 1.5,
//                     transition: "color 0.3s ease",
//                     filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.3))",
//                   }}
//                 />
//                 <Box>
//                   <Typography
//                     fontWeight={800}
//                     variant="h6"
//                     sx={{ letterSpacing: 0.5, lineHeight: 1.2 }}
//                   >
//                     AcademiGuard
//                   </Typography>
//                   <Typography
//                     variant="caption"
//                     sx={{
//                       opacity: 0.7,
//                       fontWeight: 700,
//                       letterSpacing: 1.5,
//                       fontSize: "0.65rem",
//                     }}
//                   >
//                     LEARNING PLATFORM
//                   </Typography>
//                 </Box>
//               </Box>

//               {/* NAV LINKS */}
//               <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
//                 {navItems.map((item, index) => {
//                   const active = isActive(item.path, item.exact);
//                   return (
//                     <Tooltip key={item.path} title={item.label} arrow>
//                       <Button
//                         component={Link}
//                         to={item.path}
//                         startIcon={
//                           <Box
//                             sx={{
//                               display: "flex",
//                               transform: active ? "scale(1.1)" : "scale(1)",
//                               transition: "transform 0.2s ease",
//                             }}
//                           >
//                             {item.icon}
//                           </Box>
//                         }
//                         sx={{
//                           color: active
//                             ? theme.accent
//                             : "rgba(255, 255, 255, 0.75)",
//                           fontWeight: active ? 700 : 500,
//                           textTransform: "none",
//                           fontSize: "0.9rem",
//                           letterSpacing: 0.5,
//                           borderRadius: "10px",
//                           padding: item.iconOnly ? "8px" : "6px 16px",
//                           minWidth: item.iconOnly ? "auto" : "auto",
//                           position: "relative",
//                           transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
//                           background: active
//                             ? "rgba(255,215,0,0.1)"
//                             : "transparent",
//                           "&:hover": {
//                             background: active
//                               ? "rgba(255,215,0,0.15)"
//                               : "rgba(255,255,255,0.08)",
//                             color: active ? theme.accent : "white",
//                             transform: "translateY(-2px)",
//                           },
//                           // Animated underline for active state
//                           "&::after": {
//                             content: '""',
//                             position: "absolute",
//                             bottom: 0,
//                             left: "50%",
//                             transform: active
//                               ? "translateX(-50%) scaleX(1)"
//                               : "translateX(-50%) scaleX(0)",
//                             width: "20px",
//                             height: "3px",
//                             backgroundColor: theme.accent,
//                             borderRadius: "4px 4px 0 0",
//                             transition: "transform 0.3s ease",
//                           },
//                         }}
//                       >
//                         {!item.iconOnly && item.label}
//                       </Button>
//                     </Tooltip>
//                   );
//                 })}
//               </Box>
//             </Box>

//             {/* RIGHT SIDE */}
//             <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
//               {/* USER BADGE */}
//               {currentUser && (
//                 <Chip
//                   icon={
//                     <ProfileIcon
//                       sx={{
//                         fontSize: "1.1rem !important",
//                         color: "rgba(255,255,255,0.9) !important",
//                       }}
//                     />
//                   }
//                   label={`${userData?.role?.toUpperCase() || "USER"} • ${currentUser?.uid?.substring(0, 5) || ""}...`}
//                   sx={{
//                     background: "rgba(255, 255, 255, 0.1)",
//                     border: "1px solid rgba(255, 255, 255, 0.2)",
//                     color: "white",
//                     fontWeight: 600,
//                     letterSpacing: 0.5,
//                     backdropFilter: "blur(4px)",
//                     transition: "all 0.3s ease",
//                     "&:hover": {
//                       background: "rgba(255, 255, 255, 0.2)",
//                       transform: "translateY(-1px)",
//                       boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
//                     },
//                     display: { xs: "none", sm: "flex" },
//                   }}
//                 />
//               )}

//               {/* LOGIN / LOGOUT BUTTON */}
//               {!currentUser ? (
//                 <Button
//                   component={Link}
//                   to="/login"
//                   variant="outlined"
//                   sx={{
//                     color: "white",
//                     borderColor: "rgba(255,255,255,0.5)",
//                     borderRadius: "10px",
//                     fontWeight: 600,
//                     textTransform: "none",
//                     px: 3,
//                     transition: "all 0.3s ease",
//                     "&:hover": {
//                       backgroundColor: "white",
//                       color: theme.primary,
//                       borderColor: "white",
//                       transform: "translateY(-2px)",
//                       boxShadow: "0 6px 15px rgba(0,0,0,0.2)",
//                     },
//                   }}
//                 >
//                   Login
//                 </Button>
//               ) : (
//                 <Tooltip title="Secure Logout" arrow>
//                   <IconButton
//                     onClick={handleLogout}
//                     sx={{
//                       color: "white",
//                       backgroundColor: "rgba(255,255,255,0.1)",
//                       border: "1px solid rgba(255,255,255,0.1)",
//                       borderRadius: "12px",
//                       transition:
//                         "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
//                       "&:hover": {
//                         backgroundColor: "rgba(244, 67, 54, 0.2)", // Subtle red tint on hover
//                         color: "#ffcdd2",
//                         borderColor: "rgba(244, 67, 54, 0.3)",
//                         transform: "scale(1.1) rotate(5deg)",
//                       },
//                       "&:active": {
//                         transform: "scale(0.95)",
//                       },
//                     }}
//                   >
//                     <LogoutIcon sx={{ fontSize: "1.3rem" }} />
//                   </IconButton>
//                 </Tooltip>
//               )}
//             </Box>
//           </Toolbar>
//         </Container>
//       </AppBar>
//     </>
//   );
// };

// export default NavigationBar;
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
  ExitToApp as LogoutIcon,
} from "@mui/icons-material";

const NavigationBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { currentUser, userData, logout } = useAuth();

  // Updated to match the dark blue/slate theme of the login/signup pages
  const theme = {
    primary: "#0F172A", // slate-900
    secondary: "#1E3A8A", // blue-900
    accent: "#60A5FA", // blue-400 (for active states)
    textLight: "#CBD5E1", // slate-300
    white: "#FFFFFF",
  };

  // Completely removed icons for a cleaner, professional look
  const navItems = [
    { path: "/", label: "Home", exact: true },
    { path: "/risk", label: "Risk Dashboard" },
    { path: "/recommendation", label: "Recommendation" },
    { path: "/WorkloadDashboard", label: "Workload Dashboard" },
    { path: "/announcements", label: "Announcements" },
  ];

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
          to { opacity: 1; transform: translateY(0); }
        }
        .nav-animate-in {
          animation: slideDownFade 0.5s ease-out forwards;
        }
      `}</style>

      <AppBar
        position="sticky"
        elevation={0}
        className="nav-animate-in"
        sx={{
          // Deep translucent blue/slate for that 3D glass look
          background: `linear-gradient(to right, rgba(15, 23, 42, 0.9), rgba(30, 58, 138, 0.9))`,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: `1px solid rgba(255, 255, 255, 0.08)`,
          boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
          zIndex: 1100,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{ display: "flex", justifyContent: "space-between", py: 1 }}
          >
            {/* LEFT SIDE: Logo & Nav */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 2, lg: 5 },
              }}
            >
              {/* LOGO */}
              <Box
                component={Link}
                to="/"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "white",
                  transition: "opacity 0.2s ease",
                  "&:hover": { opacity: 0.8 },
                }}
              >
                <SchoolIcon
                  sx={{
                    fontSize: 36,
                    mr: 1.5,
                    color: theme.accent,
                    filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.4))",
                  }}
                />
                <Box>
                  <Typography
                    fontWeight={800}
                    variant="h6"
                    sx={{ letterSpacing: "-0.02em", lineHeight: 1.1 }}
                  >
                    AcademiGuard
                  </Typography>
                </Box>
              </Box>

              {/* NAV LINKS (Text Only) */}
              <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1.5 }}>
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
                        fontSize: "0.95rem",
                        letterSpacing: "0.01em",
                        padding: "6px 12px",
                        position: "relative",
                        transition: "color 0.2s ease",
                        "&:hover": {
                          color: theme.white,
                          backgroundColor: "transparent",
                        },
                        // Elegant active indicator (bottom dot/line)
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          bottom: 0,
                          left: "50%",
                          transform: active
                            ? "translateX(-50%)"
                            : "translateX(-50%) scaleX(0)",
                          width: "20px",
                          height: "2px",
                          backgroundColor: theme.accent,
                          borderRadius: "2px",
                          transition: "transform 0.3s ease",
                        },
                        "&:hover::after": {
                          transform: "translateX(-50%) scaleX(1)",
                          backgroundColor: active
                            ? theme.accent
                            : theme.textLight,
                        },
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Box>
            </Box>

            {/* RIGHT SIDE: User & Logout */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              {/* CLEAN USER BADGE */}
              {currentUser && (
                <Box
                  sx={{
                    display: { xs: "none", sm: "flex" },
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Typography
                    sx={{
                      color: theme.textLight,
                      fontSize: "0.85rem",
                      fontWeight: 500,
                    }}
                  >
                    {userData?.role?.toUpperCase() || "USER"}
                  </Typography>
                  <Box
                    sx={{
                      width: "1px",
                      height: "20px",
                      backgroundColor: "rgba(255,255,255,0.2)",
                    }}
                  />
                  <Typography
                    sx={{
                      color: theme.white,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    {currentUser?.uid?.substring(0, 5)}
                  </Typography>
                </Box>
              )}

              {/* LOGIN / LOGOUT */}
              {!currentUser ? (
                <Button
                  component={Link}
                  to="/login"
                  sx={{
                    color: theme.primary,
                    backgroundColor: theme.white,
                    borderRadius: "8px",
                    fontWeight: 600,
                    textTransform: "none",
                    px: 3,
                    py: 0.8,
                    boxShadow: "0 4px 14px 0 rgba(255, 255, 255, 0.2)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "#F8FAFC",
                      transform: "translateY(-1px)",
                      boxShadow: "0 6px 20px 0 rgba(255, 255, 255, 0.3)",
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
                      transition: "all 0.2s ease",
                      "&:hover": {
                        color: "#F87171", // Soft red
                        backgroundColor: "rgba(248, 113, 113, 0.1)",
                      },
                    }}
                  >
                    <LogoutIcon sx={{ fontSize: "1.3rem" }} />
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