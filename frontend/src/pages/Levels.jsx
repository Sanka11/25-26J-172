
// import { useNavigate } from "react-router-dom";

// export default function Levels({ currentLevel = 1 }) {
//   const navigate = useNavigate();

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>🎮 Game Levels</h2>

//       {[1, 2, 3, 4, 5].map((lvl) => (
//         <button
//           key={lvl}
//           disabled={lvl > currentLevel}
//           onClick={() => navigate(`/quiz/${lvl}`)}
//           style={{
//             margin: 6,
//             padding: "10px 16px",
//             cursor: lvl > currentLevel ? "not-allowed" : "pointer",
//             opacity: lvl > currentLevel ? 0.4 : 1,
//           }}
//         >
//           Level {lvl}
//         </button>
//       ))}
//     </div>
//   );
// }
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Confetti from "react-confetti"; // Optional: install with npm install react-confetti

export default function Levels({ currentLevel = 1 }) {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);
  const [hoveredLevel, setHoveredLevel] = useState(null);
  const [completedLevels, setCompletedLevels] = useState(
    Array.from({ length: currentLevel - 1 }, (_, i) => i + 1)
  );
  const [unlockedAnimations, setUnlockedAnimations] = useState([]);

  // Light purple game theme
  const theme = {
    primary: "#9C27B0",
    lightPrimary: "#E1BEE7",
    secondary: "#7B1FA2",
    darkPurple: "#6A1B9A",
    background: "#F5F0FA",
    gradientStart: "#E1BEE7",
    gradientEnd: "#CE93D8",
    gold: "#FFD700",
    silver: "#C0C0C0",
    bronze: "#CD7F32",
    success: "#4CAF50",
    text: "#333333",
    lightText: "#666666",
  };

  useEffect(() => {
    // Show confetti when user completes a new level
    if (currentLevel > 1 && !showConfetti) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [currentLevel]);

  const handleLevelClick = (level) => {
    if (level <= currentLevel) {
      // Trigger unlock animation for newly unlocked levels
      if (level === currentLevel) {
        setUnlockedAnimations([...unlockedAnimations, level]);
        setTimeout(() => {
          setUnlockedAnimations(unlockedAnimations.filter((l) => l !== level));
        }, 2000);
      }
      navigate(`/quiz/${level}`);
    }
  };

  const getLevelEmoji = (level) => {
    const emojis = ["🌱", "🚀", "🎯", "🏆", "👑", "⚡", "💎", "🌟", "✨", "💫"];
    return emojis[level % emojis.length];
  };

  const getLevelBadge = (level) => {
    if (level <= currentLevel - 1) {
      return "✅";
    } else if (level === currentLevel) {
      return "🎮";
    }
    return "🔒";
  };

  const getLevelTitle = (level) => {
    const titles = {
      1: "Beginner's Quest",
      2: "Rising Challenge",
      3: "Expert Arena",
      4: "Master Trial",
      5: "Grand Finale",
    };
    return titles[level] || `Level ${level}`;
  };

  const getLevelDescription = (level) => {
    const descriptions = {
      1: "Start your journey!",
      2: "Things get interesting...",
      3: "Prove your skills!",
      4: "The ultimate test!",
      5: "Become a champion!",
    };
    return descriptions[level] || "Unlock to discover!";
  };

  const styles = {
    container: {
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
      padding: "20px",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    header: {
      textAlign: "center",
      marginBottom: "40px",
      animation: "fadeInDown 0.8s ease",
    },
    title: {
      fontSize: "3rem",
      fontWeight: "800",
      background: `linear-gradient(45deg, ${theme.primary}, ${theme.secondary})`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      marginBottom: "10px",
      textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
    },
    subtitle: {
      fontSize: "1.2rem",
      color: theme.lightText,
      maxWidth: "600px",
      margin: "0 auto 20px",
    },
    progressContainer: {
      maxWidth: "500px",
      margin: "0 auto 40px",
      background: "rgba(255, 255, 255, 0.9)",
      padding: "20px",
      borderRadius: "20px",
      boxShadow: "0 10px 30px rgba(156, 39, 176, 0.2)",
    },
    progressText: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "10px",
      color: theme.text,
    },
    progressBar: {
      height: "12px",
      background: theme.lightPrimary,
      borderRadius: "6px",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
      borderRadius: "6px",
      transition: "width 1s ease",
      width: `${((currentLevel - 1) / 5) * 100}%`,
    },
    levelsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "25px",
      maxWidth: "1200px",
      margin: "0 auto",
    },
    levelCard: {
      position: "relative",
      background: "white",
      borderRadius: "20px",
      padding: "25px",
      textAlign: "center",
      cursor: "pointer",
      transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      transform: "translateY(0)",
      boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
      border: "3px solid transparent",
      overflow: "hidden",
    },
    levelCardLocked: {
      filter: "grayscale(0.8)",
      cursor: "not-allowed",
      opacity: "0.7",
    },
    levelCardUnlocked: {
      cursor: "pointer",
    },
    levelCardCurrent: {
      border: `3px solid ${theme.primary}`,
      boxShadow: `0 0 30px ${theme.lightPrimary}`,
    },
    levelBadge: {
      position: "absolute",
      top: "15px",
      right: "15px",
      fontSize: "1.5rem",
    },
    levelEmoji: {
      fontSize: "3rem",
      marginBottom: "15px",
      display: "block",
      animation: "float 3s ease-in-out infinite",
    },
    levelNumber: {
      fontSize: "2rem",
      fontWeight: "700",
      color: theme.primary,
      marginBottom: "5px",
    },
    levelTitle: {
      fontSize: "1.3rem",
      fontWeight: "600",
      color: theme.text,
      marginBottom: "10px",
    },
    levelDescription: {
      fontSize: "0.9rem",
      color: theme.lightText,
      marginBottom: "20px",
      minHeight: "40px",
    },
    starContainer: {
      display: "flex",
      justifyContent: "center",
      gap: "5px",
      marginBottom: "20px",
    },
    star: {
      fontSize: "1.2rem",
      opacity: "0.3",
    },
    starActive: {
      opacity: "1",
      color: theme.gold,
    },
    playButton: {
      padding: "12px 30px",
      background: `linear-gradient(45deg, ${theme.primary}, ${theme.secondary})`,
      color: "white",
      border: "none",
      borderRadius: "50px",
      fontSize: "1rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 15px rgba(156, 39, 176, 0.4)",
    },
    lockIcon: {
      fontSize: "2rem",
      color: theme.lightText,
      marginBottom: "15px",
    },
    lockedText: {
      color: theme.lightText,
      fontSize: "0.9rem",
      marginBottom: "20px",
    },
    achievementSection: {
      maxWidth: "1200px",
      margin: "50px auto",
      padding: "30px",
      background: "rgba(255, 255, 255, 0.9)",
      borderRadius: "20px",
      boxShadow: "0 10px 30px rgba(156, 39, 176, 0.2)",
    },
    achievementTitle: {
      fontSize: "1.8rem",
      fontWeight: "700",
      color: theme.primary,
      textAlign: "center",
      marginBottom: "30px",
    },
    achievementsGrid: {
      display: "flex",
      justifyContent: "center",
      gap: "20px",
      flexWrap: "wrap",
    },
    achievementBadge: {
      width: "80px",
      height: "80px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "2rem",
      background: `linear-gradient(45deg, ${theme.lightPrimary}, ${theme.primary})`,
      color: "white",
      animation: "pulse 2s infinite",
    },
    unlockAnimation: {
      position: "absolute",
      top: "0",
      left: "0",
      right: "0",
      bottom: "0",
      background: `radial-gradient(circle, ${theme.lightPrimary} 0%, transparent 70%)`,
      animation: "unlockGlow 2s ease",
      zIndex: "1",
    },
  };

  // Add animations to document head
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translateY(-30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes float {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-10px);
        }
      }
      
      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.1);
        }
      }
      
      @keyframes unlockGlow {
        0% {
          opacity: 0;
          transform: scale(0.5);
        }
        50% {
          opacity: 1;
          transform: scale(1);
        }
        100% {
          opacity: 0;
          transform: scale(1.5);
        }
      }
      
      @keyframes bounce {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-20px);
        }
      }
      
      @keyframes sparkle {
        0%, 100% {
          opacity: 0;
          transform: scale(0);
        }
        50% {
          opacity: 1;
          transform: scale(1);
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={styles.container}>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          colors={[theme.primary, theme.secondary, theme.lightPrimary]}
        />
      )}

      <div style={styles.header}>
        <h1 style={styles.title}>🚀 Knowledge Quest</h1>
        <p style={styles.subtitle}>
          Complete levels to unlock new challenges and earn achievements!
        </p>
      </div>

      {/* Progress Section */}
      <div style={styles.progressContainer}>
        <div style={styles.progressText}>
          <span>Your Progress</span>
          <span>{currentLevel - 1}/5 levels completed</span>
        </div>
        <div style={styles.progressBar}>
          <div style={styles.progressFill}></div>
        </div>
      </div>

      {/* Levels Grid */}
      <div style={styles.levelsGrid}>
        {[1, 2, 3, 4, 5].map((level) => {
          const isLocked = level > currentLevel;
          const isCurrent = level === currentLevel;
          const isCompleted = level < currentLevel;
          const isUnlocking = unlockedAnimations.includes(level);

          return (
            <div
              key={level}
              style={{
                ...styles.levelCard,
                ...(isLocked
                  ? styles.levelCardLocked
                  : styles.levelCardUnlocked),
                ...(isCurrent && !isLocked ? styles.levelCardCurrent : {}),
                transform:
                  hoveredLevel === level && !isLocked
                    ? "translateY(-10px)"
                    : "translateY(0)",
                boxShadow:
                  hoveredLevel === level && !isLocked
                    ? "0 20px 40px rgba(156, 39, 176, 0.3)"
                    : styles.levelCard.boxShadow,
              }}
              onMouseEnter={() => !isLocked && setHoveredLevel(level)}
              onMouseLeave={() => setHoveredLevel(null)}
              onClick={() => handleLevelClick(level)}
            >
              {isUnlocking && <div style={styles.unlockAnimation}></div>}

              <div style={styles.levelBadge}>{getLevelBadge(level)}</div>

              <span
                style={{
                  ...styles.levelEmoji,
                  animationDelay: `${level * 0.2}s`,
                }}
              >
                {getLevelEmoji(level)}
              </span>

              <h2 style={styles.levelNumber}>Level {level}</h2>
              <h3 style={styles.levelTitle}>{getLevelTitle(level)}</h3>
              <p style={styles.levelDescription}>
                {getLevelDescription(level)}
              </p>

              {isLocked ? (
                <>
                  <div style={styles.lockIcon}>🔒</div>
                  <p style={styles.lockedText}>
                    Complete Level {level - 1} to unlock
                  </p>
                </>
              ) : (
                <>
                  <div style={styles.starContainer}>
                    {[1, 2, 3].map((star) => (
                      <span
                        key={star}
                        style={{
                          ...styles.star,
                          ...(star <= (isCompleted ? 3 : 0)
                            ? styles.starActive
                            : {}),
                        }}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                  <button
                    style={{
                      ...styles.playButton,
                      transform:
                        hoveredLevel === level ? "scale(1.05)" : "scale(1)",
                      background: isCurrent
                        ? `linear-gradient(45deg, ${theme.success}, ${theme.primary})`
                        : styles.playButton.background,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLevelClick(level);
                    }}
                  >
                    {isCurrent ? "Continue" : "Play"} →
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Achievements Section */}
      <div style={styles.achievementSection}>
        <h2 style={styles.achievementTitle}>🏆 Your Achievements</h2>
        <div style={styles.achievementsGrid}>
          <div style={styles.achievementBadge}>
            {currentLevel >= 1 ? "🥇" : "?"}
          </div>
          <div
            style={{
              ...styles.achievementBadge,
              animation: currentLevel >= 3 ? "pulse 2s infinite" : "none",
              opacity: currentLevel >= 3 ? 1 : 0.5,
            }}
          >
            {currentLevel >= 3 ? "💪" : "?"}
          </div>
          <div
            style={{
              ...styles.achievementBadge,
              animation: currentLevel >= 5 ? "bounce 2s infinite" : "none",
              opacity: currentLevel >= 5 ? 1 : 0.5,
            }}
          >
            {currentLevel >= 5 ? "👑" : "?"}
          </div>
        </div>
        <p
          style={{
            textAlign: "center",
            color: theme.lightText,
            marginTop: "20px",
          }}
        >
          Complete more levels to unlock secret achievements!
        </p>
      </div>

      {/* Floating particles effect */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: "4px",
              height: "4px",
              background: theme.lightPrimary,
              borderRadius: "50%",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `sparkle ${2 + Math.random() * 3}s infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}