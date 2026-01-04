import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchQuiz, submitQuiz } from "../services/api/quizApi";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  CircularProgress,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Badge,
} from "@mui/material";
import {
  Lightbulb as HintIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Timer as TimerIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Replay as ReplayIcon,
  Speed as SpeedIcon,
  HourglassEmpty as HourglassIcon,
  School as SchoolIcon,
  MenuBook as BookIcon,
  EmojiEvents as TrophyIcon,
  Grade as GradeIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  List as ListIcon,
} from "@mui/icons-material";

export default function TakeQuiz() {
  const { level } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [startTimes, setStartTimes] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Timer states
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [individualTimers, setIndividualTimers] = useState({});
  const [showSpeedWarning, setShowSpeedWarning] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Current question index for sequential navigation
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Use ref to track timer interval
  const timerRef = useRef(null);
  const individualTimerRef = useRef(null);

  // University blue theme colors
  const theme = {
    primary: "#1A237E", // Dark blue
    primaryLight: "#E8EAF6",
    primaryDark: "#0D47A1",
    secondary: "#283593",
    accent: "#303F9F",
    background: "#F5F7FF",
    cardBg: "#FFFFFF",
    success: "#2E7D32", // University green
    warning: "#F57C00",
    error: "#C62828",
    text: "#1A237E",
    lightText: "#546E7A",
    highlight: "#5C6BC0",
    lightBlue: "#E3F2FD",
  };

  // Main timer effect - using ref for proper cleanup
  useEffect(() => {
    // Clear any existing interval
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (isTimerRunning && !result) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerRunning, result]);

  // Initialize individual timers for each question
  useEffect(() => {
    if (quiz) {
      const timers = {};
      const times = {};
      quiz.questions.forEach((q) => {
        timers[q.question_id] = 0;
        times[q.question_id] = Date.now();
      });
      setIndividualTimers(timers);
      setStartTimes(times);
    }
  }, [quiz]);

  // Update individual question timer - ONLY for current question
  useEffect(() => {
    // Clear any existing individual timer interval
    if (individualTimerRef.current) {
      clearInterval(individualTimerRef.current);
      individualTimerRef.current = null;
    }

    if (
      quiz &&
      isTimerRunning &&
      !result &&
      currentQuestionIndex < quiz.questions.length
    ) {
      const currentQuestion = quiz.questions[currentQuestionIndex];

      // Only start timer if current question hasn't been answered
      if (!answers[currentQuestion.question_id]?.selected_index) {
        individualTimerRef.current = setInterval(() => {
          setIndividualTimers((prev) => ({
            ...prev,
            [currentQuestion.question_id]:
              (prev[currentQuestion.question_id] || 0) + 1,
          }));
        }, 1000);
      }
    }

    return () => {
      if (individualTimerRef.current) {
        clearInterval(individualTimerRef.current);
        individualTimerRef.current = null;
      }
    };
  }, [quiz, isTimerRunning, answers, result, currentQuestionIndex]);

  // Cleanup all timers on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (individualTimerRef.current) {
        clearInterval(individualTimerRef.current);
        individualTimerRef.current = null;
      }
    };
  }, []);

  // Load quiz function
  const loadQuiz = () => {
    // Stop all timers first
    setIsTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (individualTimerRef.current) {
      clearInterval(individualTimerRef.current);
      individualTimerRef.current = null;
    }

    setLoading(true);
    setResult(null);
    setAnswers({});
    setStartTimes({});
    setTimeElapsed(0);
    setIndividualTimers({});
    setCurrentQuestionIndex(0);

    fetchQuiz(level)
      .then((data) => {
        setQuiz(data);
        setLoading(false);
        setIsRetrying(false);

        // Start timer after quiz is loaded
        setIsTimerRunning(true);
      })
      .catch((error) => {
        console.error("Error loading quiz:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadQuiz();
  }, [level]);

  const selectAnswer = (q, idx) => {
    const now = Date.now();
    const timeSpent = individualTimers[q.question_id] || 0;

    // Check if answering too quickly (less than 5 seconds)
    if (timeSpent < 5 && !answers[q.question_id]?.used_hint) {
      setShowSpeedWarning(true);
      setTimeout(() => setShowSpeedWarning(false), 3000);
    }

    setAnswers((prev) => ({
      ...prev,
      [q.question_id]: {
        selected_index: idx,
        ms_first_response:
          prev[q.question_id]?.ms_first_response ??
          now - (startTimes[q.question_id] || now),
        overlap_time: now - (startTimes[q.question_id] || now),
        used_hint: prev[q.question_id]?.used_hint || false,
        time_spent_seconds: timeSpent,
      },
    }));
  };

  const useHint = (qid) => {
    setAnswers((prev) => ({
      ...prev,
      [qid]: {
        ...prev[qid],
        used_hint: true,
      },
    }));
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    // Stop timer first
    setIsTimerRunning(false);

    // Clear intervals
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Reset state
    setTimeElapsed(0);
    if (quiz) {
      const timers = {};
      quiz.questions.forEach((q) => {
        timers[q.question_id] = 0;
      });
      setIndividualTimers(timers);
    }

    // Restart timer
    setIsTimerRunning(true);
  };

  const goToNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const goToQuestion = (index) => {
    if (quiz && index >= 0 && index < quiz.questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getTimeColor = (seconds) => {
    if (seconds < 10) return theme.error;
    if (seconds < 30) return theme.warning;
    return theme.success;
  };

  const submit = async () => {
    setSubmitting(true);

    // Stop timer immediately when submitting
    setIsTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (individualTimerRef.current) {
      clearInterval(individualTimerRef.current);
      individualTimerRef.current = null;
    }

    const payload = {
      user_id: "student_002",
      quiz_id: quiz.quiz_id,
      quiz_level: quiz.level,
      answers: quiz.questions.map((q) => ({
        question_id: q.question_id,
        lesson: q.lesson,
        selected_index: answers[q.question_id]?.selected_index ?? -1,
        correct:
          answers[q.question_id]?.selected_index === q.correct_index ? 1 : 0,
        used_hint: answers[q.question_id]?.used_hint ?? false,
        ms_first_response: answers[q.question_id]?.ms_first_response ?? 0,
        overlap_time: answers[q.question_id]?.overlap_time ?? 0,
        time_spent_seconds: answers[q.question_id]?.time_spent_seconds ?? 0,
      })),
      total_time_seconds: timeElapsed,
    };

    try {
      const res = await submitQuiz(payload);
      setResult(res);

      // Save progress to localStorage
      if (res.passed) {
        const currentLevel = parseInt(level);
        const nextLevel = currentLevel + 1;
        const savedProgress = JSON.parse(
          localStorage.getItem("quizProgress") || "{}"
        );
        savedProgress.highestLevel = Math.max(
          savedProgress.highestLevel || 1,
          nextLevel
        );
        savedProgress.completedLevels = savedProgress.completedLevels || [];
        if (!savedProgress.completedLevels.includes(currentLevel)) {
          savedProgress.completedLevels.push(currentLevel);
        }
        localStorage.setItem("quizProgress", JSON.stringify(savedProgress));
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const getAverageTimePerQuestion = () => {
    if (getAnsweredCount() === 0) return 0;
    const totalTime = Object.values(answers).reduce(
      (sum, ans) => sum + (ans.time_spent_seconds || 0),
      0
    );
    return Math.round(totalTime / getAnsweredCount());
  };

  const handleRetryLevel = () => {
    // Stop all timers before resetting
    setIsTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (individualTimerRef.current) {
      clearInterval(individualTimerRef.current);
      individualTimerRef.current = null;
    }

    setIsRetrying(true);
    loadQuiz();
  };

  const handleNextLevel = () => {
    // Stop all timers before navigation
    setIsTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (individualTimerRef.current) {
      clearInterval(individualTimerRef.current);
      individualTimerRef.current = null;
    }

    const nextLevel = result.next_level || parseInt(level) + 1;

    // Save that next level is unlocked
    const savedProgress = JSON.parse(
      localStorage.getItem("quizProgress") || "{}"
    );
    savedProgress.unlockedLevels = savedProgress.unlockedLevels || [];
    if (!savedProgress.unlockedLevels.includes(nextLevel)) {
      savedProgress.unlockedLevels.push(nextLevel);
      localStorage.setItem("quizProgress", JSON.stringify(savedProgress));
    }

    // Navigate after ensuring timers are stopped
    navigate(`/quiz/${nextLevel}`);
  };

  const getLevelTitle = (level) => {
    const titles = {
      1: "Introductory Quiz",
      2: "Fundamentals Challenge",
      3: "Intermediate Assessment",
      4: "Advanced Concepts",
      5: "Expert Level",
      6: "Mastery Test",
      7: "Scholarly Examination",
      8: "Academic Challenge",
      9: "Final Review",
      10: "Comprehensive Final",
    };
    return titles[level] || `Level ${level}`;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #F5F7FF 0%, #E8EAF6 100%)",
        }}
      >
        <Box sx={{ position: "relative" }}>
          <CircularProgress
            size={80}
            sx={{
              color: theme.primary,
              animationDuration: "1.5s",
            }}
          />
          <SchoolIcon
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: 30,
              color: theme.primary,
            }}
          />
        </Box>
        <Typography
          variant="h6"
          sx={{
            mt: 3,
            color: theme.text,
            fontWeight: 600,
          }}
        >
          Loading Quiz {level}...
        </Typography>
      </Box>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const timeSpent = individualTimers[currentQuestion?.question_id] || 0;
  const isAnswered =
    answers[currentQuestion?.question_id]?.selected_index !== undefined;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #F5F7FF 0%, #E8EAF6 100%)",
        p: { xs: 2, md: 4 },
      }}
    >
      {/* Speed Warning Alert */}
      {showSpeedWarning && (
        <Box
          sx={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 1000,
            animation: "slideIn 0.3s ease",
          }}
        >
          <Alert
            severity="warning"
            sx={{
              borderRadius: 2,
              boxShadow: 3,
              borderLeft: `4px solid ${theme.warning}`,
            }}
          >
            ⚡ You're answering very quickly! Make sure to read carefully.
          </Alert>
        </Box>
      )}

      <Paper
        elevation={0}
        sx={{
          maxWidth: 1000,
          mx: "auto",
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          backgroundColor: theme.cardBg,
          boxShadow: "0 8px 32px rgba(26, 35, 126, 0.15)",
          border: `1px solid ${theme.primaryLight}`,
        }}
      >
        {/* Header with Timer */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <SchoolIcon sx={{ color: theme.primary, mr: 2, fontSize: 40 }} />
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: theme.primary }}
                >
                  {getLevelTitle(quiz.level)}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{ color: theme.lightText, fontWeight: 500 }}
                >
                  Level {quiz.level} • {quiz.questions.length} Questions
                </Typography>
              </Box>
            </Box>

            {/* Timer Section */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  background: `linear-gradient(135deg, ${theme.primaryLight}, ${theme.lightBlue})`,
                  p: 1.5,
                  borderRadius: 3,
                  minWidth: 140,
                  justifyContent: "space-between",
                  border: `1px solid ${theme.primary}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TimerIcon sx={{ color: theme.primaryDark }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: theme.primaryDark,
                      fontFamily: "monospace",
                    }}
                  >
                    {formatTime(timeElapsed)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={toggleTimer}
                    sx={{
                      color: theme.primaryDark,
                      backgroundColor: "rgba(255,255,255,0.9)",
                      "&:hover": { backgroundColor: "white" },
                    }}
                  >
                    {isTimerRunning ? <PauseIcon /> : <PlayIcon />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={resetTimer}
                    sx={{
                      color: theme.primaryDark,
                      backgroundColor: "rgba(255,255,255,0.9)",
                      "&:hover": { backgroundColor: "white" },
                    }}
                  >
                    <ReplayIcon />
                  </IconButton>
                </Box>
              </Box>

              <Chip
                label={`Question ${currentQuestionIndex + 1} of ${
                  quiz.questions.length
                }`}
                sx={{
                  background: `linear-gradient(135deg, ${theme.accent}, ${theme.secondary})`,
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  boxShadow: "0 3px 10px rgba(48, 63, 159, 0.3)",
                }}
              />
            </Box>
          </Box>

          {/* Progress and Time Stats Bar */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              flexWrap: "wrap",
              mb: 3,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <LinearProgress
                variant="determinate"
                value={
                  ((currentQuestionIndex + 1) / quiz.questions.length) * 100
                }
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: theme.primaryLight,
                  "& .MuiLinearProgress-bar": {
                    background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
                    borderRadius: 5,
                  },
                }}
              />
            </Box>

            {/* Question Navigation Dots */}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {quiz.questions.map((q, idx) => (
                <Tooltip key={q.question_id} title={`Question ${idx + 1}`}>
                  <Box
                    onClick={() => goToQuestion(idx)}
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor:
                        idx === currentQuestionIndex
                          ? theme.primary
                          : answers[q.question_id]?.selected_index !== undefined
                          ? theme.success
                          : theme.primaryLight,
                      cursor: "pointer",
                      border: `1px solid ${theme.primary}`,
                      "&:hover": {
                        transform: "scale(1.2)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>

          {/* Question Timer Display */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 2,
              mb: 3,
            }}
          >
            <Chip
              icon={<HourglassIcon />}
              label={`Current Question: ${timeSpent}s`}
              sx={{
                backgroundColor: getTimeColor(timeSpent),
                color: "white",
                fontWeight: 700,
                fontSize: "1rem",
                px: 2,
                py: 2,
              }}
            />
            <Typography variant="body2" sx={{ color: theme.lightText }}>
              {isAnswered
                ? "✓ Answered"
                : isTimerRunning
                ? "⏳ Timer running..."
                : "⏸ Timer paused"}
            </Typography>
          </Box>
        </Box>

        {/* Quiz Questions - Only show current question */}
        {!result && currentQuestion && (
          <>
            <Card
              sx={{
                mb: 3,
                border: `2px solid ${
                  isAnswered ? theme.secondary : theme.primary
                }`,
                borderRadius: 3,
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: "0 8px 25px rgba(26, 35, 126, 0.2)",
                },
                position: "relative",
                background: isAnswered
                  ? `linear-gradient(135deg, ${theme.cardBg}, ${theme.primaryLight}20)`
                  : theme.cardBg,
              }}
            >
              {/* Question Timer Indicator */}
              <Box
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                {!isAnswered && (
                  <Badge
                    badgeContent={timeSpent}
                    color="primary"
                    sx={{
                      "& .MuiBadge-badge": {
                        backgroundColor: getTimeColor(timeSpent),
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "0.75rem",
                      },
                    }}
                  >
                    <HourglassIcon sx={{ color: theme.primary }} />
                  </Badge>
                )}
                {isAnswered && (
                  <Chip
                    size="small"
                    label={`${
                      answers[currentQuestion.question_id]
                        ?.time_spent_seconds || 0
                    }s`}
                    sx={{
                      backgroundColor: getTimeColor(
                        answers[currentQuestion.question_id]
                          ?.time_spent_seconds || 0
                      ),
                      color: "white",
                      fontWeight: "bold",
                    }}
                  />
                )}
              </Box>

              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    color: theme.text,
                    display: "flex",
                    alignItems: "center",
                    pr: 6,
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mr: 2,
                      fontSize: "1rem",
                      fontWeight: 700,
                      boxShadow: "0 3px 10px rgba(26, 35, 126, 0.3)",
                    }}
                  >
                    {currentQuestionIndex + 1}
                  </Box>
                  {currentQuestion.question}
                </Typography>

                <FormControl component="fieldset" sx={{ width: "100%" }}>
                  <RadioGroup>
                    {currentQuestion.options.map((option, idx) => (
                      <Paper
                        key={idx}
                        elevation={0}
                        onClick={() => selectAnswer(currentQuestion, idx)}
                        sx={{
                          mb: 1,
                          p: 2,
                          borderRadius: 2,
                          cursor: "pointer",
                          backgroundColor:
                            answers[currentQuestion.question_id]
                              ?.selected_index === idx
                              ? theme.primaryLight
                              : theme.background,
                          border: `2px solid ${
                            answers[currentQuestion.question_id]
                              ?.selected_index === idx
                              ? theme.primary
                              : theme.primaryLight
                          }`,
                          transition: "all 0.2s ease",
                          "&:hover": {
                            backgroundColor: theme.primaryLight,
                            transform: "translateX(4px)",
                          },
                          position: "relative",
                        }}
                      >
                        {answers[currentQuestion.question_id]
                          ?.selected_index === idx && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: -8,
                              right: -8,
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: `linear-gradient(135deg, ${theme.success}, #2E7D32)`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "0.75rem",
                              boxShadow: "0 2px 8px rgba(46, 125, 50, 0.3)",
                            }}
                          >
                            ✓
                          </Box>
                        )}
                        <FormControlLabel
                          value={idx.toString()}
                          control={
                            <Radio
                              checked={
                                answers[currentQuestion.question_id]
                                  ?.selected_index === idx
                              }
                              sx={{
                                color: theme.primary,
                                "&.Mui-checked": {
                                  color: theme.primary,
                                },
                              }}
                            />
                          }
                          label={
                            <Typography
                              sx={{
                                color: theme.text,
                                fontWeight: 500,
                              }}
                            >
                              {option}
                            </Typography>
                          }
                          sx={{ m: 0, width: "100%" }}
                        />
                      </Paper>
                    ))}
                  </RadioGroup>
                </FormControl>

                <Accordion
                  elevation={0}
                  sx={{
                    mt: 2,
                    backgroundColor: "transparent",
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      <ExpandMoreIcon sx={{ color: theme.primary }} />
                    }
                    onClick={() => useHint(currentQuestion.question_id)}
                    sx={{
                      background: `linear-gradient(135deg, ${theme.primaryLight}, ${theme.lightBlue})`,
                      borderRadius: 2,
                      "&.Mui-expanded": {
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <HintIcon sx={{ mr: 1, color: theme.primaryDark }} />
                      <Typography
                        sx={{ color: theme.primaryDark, fontWeight: 600 }}
                      >
                        Need a hint?{" "}
                        {answers[currentQuestion.question_id]?.used_hint && (
                          <Chip
                            label="Used"
                            size="small"
                            sx={{
                              ml: 1,
                              height: 20,
                              fontSize: "0.7rem",
                              backgroundColor: theme.primaryDark,
                              color: "white",
                              fontWeight: 600,
                            }}
                          />
                        )}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      backgroundColor: theme.primaryLight,
                      borderRadius: "0 0 8px 8px",
                      border: `1px solid ${theme.primary}`,
                      borderTop: "none",
                    }}
                  >
                    <Typography sx={{ color: theme.text, fontStyle: "italic" }}>
                      💡 {currentQuestion.hint}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: 4,
                mb: 4,
              }}
            >
              <Button
                variant="outlined"
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                startIcon={<PrevIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  borderColor: theme.primary,
                  color: theme.primary,
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: theme.primaryDark,
                    backgroundColor: `${theme.primary}10`,
                    transform: "translateY(-2px)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Previous
              </Button>

              <Button
                variant="outlined"
                onClick={goToNextQuestion}
                disabled={currentQuestionIndex === quiz.questions.length - 1}
                endIcon={<NextIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  borderColor: theme.primary,
                  color: theme.primary,
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: theme.primaryDark,
                    backgroundColor: `${theme.primary}10`,
                    transform: "translateY(-2px)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Next
              </Button>
            </Box>

            {/* Submit Button with Time Summary */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 4,
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
              }}
            >
              {getAnsweredCount() > 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${theme.primaryLight}, ${theme.lightBlue})`,
                    width: "100%",
                    maxWidth: 500,
                    border: `1px solid ${theme.primary}`,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      textAlign: "center",
                      color: theme.primaryDark,
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    <TimerIcon />
                    Time Summary
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-around",
                      flexWrap: "wrap",
                      gap: 2,
                    }}
                  >
                    <Box sx={{ textAlign: "center" }}>
                      <Typography
                        variant="caption"
                        sx={{ color: theme.lightText }}
                      >
                        Total Time
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ color: theme.primaryDark, fontWeight: 700 }}
                      >
                        {formatTime(timeElapsed)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography
                        variant="caption"
                        sx={{ color: theme.lightText }}
                      >
                        Avg Time
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          color: getTimeColor(getAverageTimePerQuestion()),
                          fontWeight: 700,
                        }}
                      >
                        {getAverageTimePerQuestion()}s
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography
                        variant="caption"
                        sx={{ color: theme.lightText }}
                      >
                        Answered
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ color: theme.secondary, fontWeight: 700 }}
                      >
                        {getAnsweredCount()}/{quiz.questions.length}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              )}

              <Button
                variant="contained"
                onClick={submit}
                disabled={
                  submitting || getAnsweredCount() < quiz.questions.length
                }
                sx={{
                  px: 6,
                  py: 2,
                  borderRadius: 3,
                  fontSize: "1.1rem",
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  "&:hover": {
                    background: `linear-gradient(135deg, ${theme.primaryDark}, ${theme.primary})`,
                    transform: "translateY(-3px)",
                    boxShadow: "0 10px 25px rgba(26, 35, 126, 0.4)",
                  },
                  "&:disabled": {
                    background: theme.primaryLight,
                  },
                  transition: "all 0.3s ease",
                  fontWeight: 600,
                  boxShadow: "0 6px 20px rgba(26, 35, 126, 0.3)",
                }}
                startIcon={
                  submitting ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <GradeIcon />
                  )
                }
              >
                {submitting
                  ? "Submitting..."
                  : `Submit Quiz (${formatTime(timeElapsed)})`}
              </Button>
            </Box>
          </>
        )}

        {/* Results Section */}
        {result && (
          <Box
            sx={{
              animation: "fadeIn 0.5s ease",
              "@keyframes fadeIn": {
                from: { opacity: 0, transform: "translateY(20px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
            }}
          >
            {/* Result Header with Time Stats */}
            <Box
              sx={{
                textAlign: "center",
                mb: 4,
                p: 4,
                borderRadius: 4,
                background: result.passed
                  ? `linear-gradient(135deg, ${theme.success}20, ${theme.success}40)`
                  : `linear-gradient(135deg, ${theme.error}20, ${theme.error}40)`,
                border: `2px solid ${
                  result.passed ? theme.success : theme.error
                }`,
                boxShadow: result.passed
                  ? "0 10px 30px rgba(46, 125, 50, 0.2)"
                  : "0 10px 30px rgba(198, 40, 40, 0.2)",
              }}
            >
              {result.passed ? (
                <Box sx={{ position: "relative", display: "inline-block" }}>
                  <TrophyIcon
                    sx={{ fontSize: 80, color: theme.success, mb: 2 }}
                  />
                </Box>
              ) : (
                <ErrorIcon sx={{ fontSize: 80, color: theme.error, mb: 2 }} />
              )}
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {result.passed ? "🎓 Level Passed!" : "📚 Level Not Cleared"}
              </Typography>
              <Typography variant="h6" sx={{ color: theme.lightText, mb: 2 }}>
                Score: {(result.quiz_avg_score * 100).toFixed(0)}%
              </Typography>

              {/* Time Performance */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: "rgba(255,255,255,0.8)",
                  maxWidth: 400,
                  mx: "auto",
                  mt: 2,
                  border: `1px solid ${theme.primaryLight}`,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-around",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ textAlign: "center" }}>
                    <TimerIcon
                      sx={{ color: theme.primary, fontSize: 32, mb: 1 }}
                    />
                    <Typography
                      variant="h6"
                      sx={{ color: theme.primary, fontWeight: 700 }}
                    >
                      {formatTime(timeElapsed)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.lightText }}
                    >
                      Total Time
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <SpeedIcon
                      sx={{ color: theme.secondary, fontSize: 32, mb: 1 }}
                    />
                    <Typography
                      variant="h6"
                      sx={{ color: theme.secondary, fontWeight: 700 }}
                    >
                      {getAverageTimePerQuestion()}s
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.lightText }}
                    >
                      Avg per question
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>

            {/* Struggling Lessons */}
            {result.struggling_lessons.length > 0 ? (
              <Card
                sx={{
                  mb: 4,
                  borderRadius: 3,
                  border: `1px solid ${theme.warning}`,
                }}
              >
                <CardContent>
                  <Typography
                    variant="h5"
                    sx={{
                      mb: 3,
                      color: theme.warning,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <ErrorIcon sx={{ mr: 1 }} />
                    Areas to Improve
                  </Typography>
                  <List>
                    {result.struggling_lessons.map((lesson, index) => (
                      <Box key={index}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Typography
                                variant="h6"
                                sx={{ color: theme.text, fontWeight: 600 }}
                              >
                                {lesson.lesson}
                              </Typography>
                            }
                            secondary={
                              <Typography
                                sx={{ color: theme.lightText, mt: 0.5 }}
                              >
                                Difficulty score:{" "}
                                <Box
                                  component="span"
                                  sx={{ color: theme.warning, fontWeight: 600 }}
                                >
                                  {(
                                    lesson.average_struggle_score * 100
                                  ).toFixed(0)}
                                  %
                                </Box>
                              </Typography>
                            }
                          />
                          <CircularProgress
                            variant="determinate"
                            value={lesson.average_struggle_score * 100}
                            size={60}
                            thickness={4}
                            sx={{
                              color: theme.warning,
                              "& .MuiCircularProgress-circle": {
                                strokeLinecap: "round",
                              },
                            }}
                          />
                        </ListItem>
                        {index < result.struggling_lessons.length - 1 && (
                          <Divider />
                        )}
                      </Box>
                    ))}
                  </List>
                </CardContent>
              </Card>
            ) : (
              <Alert
                severity="success"
                sx={{
                  mb: 4,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${theme.success}20, ${theme.success}40)`,
                  color: theme.text,
                  border: `1px solid ${theme.success}`,
                }}
                icon={<CheckCircleIcon sx={{ color: theme.success }} />}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ✅ Perfect Performance!
                </Typography>
                <Typography>
                  You're mastering all concepts in this level. Excellent work!
                </Typography>
              </Alert>
            )}

            {/* Action Buttons */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 3,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="outlined"
                onClick={handleRetryLevel}
                startIcon={<RefreshIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  borderColor: theme.primary,
                  color: theme.primary,
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: theme.primaryDark,
                    backgroundColor: `${theme.primary}10`,
                    transform: "translateY(-2px)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Retry Level
              </Button>
              {result.passed && (
                <Button
                  variant="contained"
                  onClick={handleNextLevel}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    px: 5,
                    py: 1.5,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${theme.success}, #2E7D32)`,
                    fontWeight: 600,
                    "&:hover": {
                      background: `linear-gradient(135deg, #2E7D32, ${theme.success})`,
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 25px rgba(46, 125, 50, 0.4)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  Next Level
                </Button>
              )}
            </Box>

            {/* Next Level Preview */}
            {result.passed && (
              <Paper
                elevation={0}
                sx={{
                  mt: 4,
                  p: 3,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${theme.primaryLight}, ${theme.lightBlue}20)`,
                  border: `1px dashed ${theme.primary}`,
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.primaryDark, mb: 1 }}
                >
                  🎉 Level {level} Completed!
                </Typography>
                <Typography sx={{ color: theme.lightText, mb: 2 }}>
                  You can now access Level{" "}
                  {result.next_level || parseInt(level) + 1}
                </Typography>
                <Button
                  variant="text"
                  onClick={() => navigate("/levels")}
                  sx={{
                    color: theme.primaryDark,
                    fontWeight: 600,
                    textDecoration: "underline",
                  }}
                >
                  View All Levels
                </Button>
              </Paper>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
