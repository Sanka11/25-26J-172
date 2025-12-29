
// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { fetchQuiz, submitQuiz } from "../services/api/quizApi";

// export default function TakeQuiz() {
//   const { level } = useParams();
//   const navigate = useNavigate();

//   const [quiz, setQuiz] = useState(null);
//   const [answers, setAnswers] = useState({});
//   const [startTimes, setStartTimes] = useState({});
//   const [result, setResult] = useState(null); // 🔹 NEW

//   useEffect(() => {
//     fetchQuiz(level).then((data) => {
//       setQuiz(data);

//       const times = {};
//       data.questions.forEach((q) => {
//         times[q.question_id] = Date.now();
//       });
//       setStartTimes(times);
//     });
//   }, [level]);

//   const selectAnswer = (q, idx) => {
//     const now = Date.now();

//     setAnswers((prev) => ({
//       ...prev,
//       [q.question_id]: {
//         selected_index: idx,
//         ms_first_response:
//           prev[q.question_id]?.ms_first_response ??
//           now - startTimes[q.question_id],
//         overlap_time: now - startTimes[q.question_id],
//         used_hint: prev[q.question_id]?.used_hint || false,
//       },
//     }));
//   };

//   const useHint = (qid) => {
//     setAnswers((prev) => ({
//       ...prev,
//       [qid]: {
//         ...prev[qid],
//         used_hint: true,
//       },
//     }));
//   };

//   const submit = async () => {
//     const payload = {
//       user_id: "student_001",
//       quiz_id: quiz.quiz_id,
//       quiz_level: quiz.level,
//       answers: quiz.questions.map((q) => ({
//         question_id: q.question_id,
//         lesson: q.lesson,
//         selected_index: answers[q.question_id]?.selected_index ?? -1,
//         correct:
//           answers[q.question_id]?.selected_index === q.correct_index ? 1 : 0,
//         used_hint: answers[q.question_id]?.used_hint ?? false,
//         ms_first_response: answers[q.question_id]?.ms_first_response ?? 0,
//         overlap_time: answers[q.question_id]?.overlap_time ?? 0,
//       })),
//     };

//     const res = await submitQuiz(payload);
//     setResult(res); // 🔹 store backend response
//   };

//   if (!quiz) return <p>Loading...</p>;

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>Level {quiz.level}</h2>

//       {/* QUIZ QUESTIONS */}
//       {!result &&
//         quiz.questions.map((q) => (
//           <div key={q.question_id} style={{ marginBottom: 20 }}>
//             <p>{q.question}</p>

//             {q.options.map((o, i) => (
//               <button
//                 key={i}
//                 onClick={() => selectAnswer(q, i)}
//                 style={{ display: "block", margin: "4px 0" }}
//               >
//                 {o}
//               </button>
//             ))}

//             <details>
//               <summary onClick={() => useHint(q.question_id)}>Hint</summary>
//               <p>{q.hint}</p>
//             </details>
//           </div>
//         ))}

//       {!result && <button onClick={submit}>Submit Quiz</button>}

//       {/* RESULT SECTION */}
//       {result && (
//         <div style={{ marginTop: 30 }}>
//           <h3>{result.passed ? "🎉 Level Passed!" : "❌ Level Not Passed"}</h3>

//           <p>
//             <strong>Quiz Average Struggle:</strong>{" "}
//             {(result.quiz_avg_score * 100).toFixed(0)}%
//           </p>

//           {/* STRUGGLING LESSONS */}
//           {result.struggling_lessons.length > 0 ? (
//             <>
//               <h4>⚠️ Struggling Lessons</h4>
//               <ul>
//                 {result.struggling_lessons.map((l, i) => (
//                   <li key={i}>
//                     {l.lesson} – {(l.average_struggle_score * 100).toFixed(0)}%
//                   </li>
//                 ))}
//               </ul>
//             </>
//           ) : (
//             <p>✅ No struggling lessons detected</p>
//           )}

//           <button
//             onClick={() =>
//               navigate(
//                 result.passed
//                   ? `/quiz/${result.next_level}`
//                   : `/quiz/${quiz.level}`
//               )
//             }
//           >
//             {result.passed ? "Go to Next Level" : "Retry Level"}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }


import { useEffect, useState } from "react";
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
  Avatar,
} from "@mui/material";
import {
  Lightbulb as HintIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Timer as TimerIcon,
  School as SchoolIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Replay as ReplayIcon,
  Speed as SpeedIcon,
  HourglassEmpty as HourglassIcon,
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
  const [questionTimeStats, setQuestionTimeStats] = useState([]);

  // Light purple theme colors
  const theme = {
    primary: "#9C27B0",
    lightPrimary: "#E1BEE7",
    secondary: "#7B1FA2",
    background: "#F5F0FA",
    cardBg: "#FFFFFF",
    success: "#4CAF50",
    warning: "#FF9800",
    error: "#F44336",
    text: "#333333",
    lightText: "#666666",
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTimerRunning && !result) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, result]);

  // Initialize individual timers for each question
  useEffect(() => {
    if (quiz) {
      const timers = {};
      quiz.questions.forEach((q) => {
        timers[q.question_id] = 0;
      });
      setIndividualTimers(timers);
    }
  }, [quiz]);

  // Update individual question timers
  useEffect(() => {
    if (quiz && isTimerRunning && !result) {
      const interval = setInterval(() => {
        setIndividualTimers((prev) => {
          const newTimers = { ...prev };
          quiz.questions.forEach((q) => {
            if (!answers[q.question_id]?.selected_index) {
              newTimers[q.question_id] = (newTimers[q.question_id] || 0) + 1;
            }
          });
          return newTimers;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [quiz, isTimerRunning, answers, result]);

  useEffect(() => {
    setLoading(true);
    fetchQuiz(level).then((data) => {
      setQuiz(data);
      const times = {};
      data.questions.forEach((q) => {
        times[q.question_id] = Date.now();
      });
      setStartTimes(times);
      setLoading(false);
    });
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
          now - startTimes[q.question_id],
        overlap_time: now - startTimes[q.question_id],
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
    setTimeElapsed(0);
    if (quiz) {
      const timers = {};
      quiz.questions.forEach((q) => {
        timers[q.question_id] = 0;
      });
      setIndividualTimers(timers);
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
      setIsTimerRunning(false);
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

  const getFastestQuestionTime = () => {
    const times = Object.values(answers)
      .map((ans) => ans.time_spent_seconds || 0)
      .filter((time) => time > 0);
    return times.length > 0 ? Math.min(...times) : 0;
  };

  const getSlowestQuestionTime = () => {
    const times = Object.values(answers)
      .map((ans) => ans.time_spent_seconds || 0)
      .filter((time) => time > 0);
    return times.length > 0 ? Math.max(...times) : 0;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: theme.background,
        }}
      >
        <CircularProgress sx={{ color: theme.primary }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: theme.background,
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
          boxShadow: "0 4px 20px rgba(156, 39, 176, 0.1)",
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
              <SchoolIcon sx={{ color: theme.primary, mr: 1, fontSize: 32 }} />
              <Typography
                variant="h4"
                sx={{ fontWeight: 600, color: theme.primary }}
              >
                Level {quiz.level}
              </Typography>
            </Box>

            {/* Timer Section */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: theme.lightPrimary,
                  p: 1.5,
                  borderRadius: 3,
                  minWidth: 140,
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TimerIcon sx={{ color: theme.primary }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: theme.primary,
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
                      color: theme.primary,
                      backgroundColor: "rgba(255,255,255,0.8)",
                      "&:hover": { backgroundColor: "white" },
                    }}
                  >
                    {isTimerRunning ? <PauseIcon /> : <PlayIcon />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={resetTimer}
                    sx={{
                      color: theme.primary,
                      backgroundColor: "rgba(255,255,255,0.8)",
                      "&:hover": { backgroundColor: "white" },
                    }}
                  >
                    <ReplayIcon />
                  </IconButton>
                </Box>
              </Box>

              <Chip
                label={`${getAnsweredCount()}/${
                  quiz.questions.length
                } answered`}
                sx={{
                  backgroundColor: theme.lightPrimary,
                  color: theme.secondary,
                  fontWeight: 500,
                  fontSize: "0.9rem",
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
            }}
          >
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <LinearProgress
                variant="determinate"
                value={(getAnsweredCount() / quiz.questions.length) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.lightPrimary,
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: theme.primary,
                    borderRadius: 4,
                  },
                }}
              />
            </Box>

            {/* Time Statistics */}
            {getAnsweredCount() > 0 && (
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Tooltip title="Average time per question">
                  <Chip
                    icon={<SpeedIcon />}
                    label={`Avg: ${getAverageTimePerQuestion()}s`}
                    size="small"
                    sx={{
                      backgroundColor:
                        getAverageTimePerQuestion() < 10
                          ? `${theme.error}20`
                          : getAverageTimePerQuestion() < 30
                          ? `${theme.warning}20`
                          : `${theme.success}20`,
                      color: getTimeColor(getAverageTimePerQuestion()),
                    }}
                  />
                </Tooltip>
              </Box>
            )}
          </Box>
        </Box>

        {/* Quiz Questions */}
        {!result && (
          <>
            {quiz.questions.map((q, index) => {
              const timeSpent = individualTimers[q.question_id] || 0;
              const isAnswered =
                answers[q.question_id]?.selected_index !== undefined;

              return (
                <Card
                  key={q.question_id}
                  sx={{
                    mb: 3,
                    border: `2px solid ${
                      isAnswered ? theme.lightPrimary : "transparent"
                    }`,
                    borderRadius: 3,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      boxShadow: "0 6px 20px rgba(156, 39, 176, 0.15)",
                    },
                    position: "relative",
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
                          },
                        }}
                      >
                        <HourglassIcon sx={{ color: theme.lightText }} />
                      </Badge>
                    )}
                    {isAnswered && (
                      <Chip
                        size="small"
                        label={`${
                          answers[q.question_id]?.time_spent_seconds || 0
                        }s`}
                        sx={{
                          backgroundColor: getTimeColor(
                            answers[q.question_id]?.time_spent_seconds || 0
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
                        pr: 6, // Make room for timer
                      }}
                    >
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          backgroundColor: theme.lightPrimary,
                          color: theme.primary,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mr: 2,
                          fontSize: "0.875rem",
                          fontWeight: 600,
                        }}
                      >
                        {index + 1}
                      </Box>
                      {q.question}
                    </Typography>

                    <FormControl component="fieldset" sx={{ width: "100%" }}>
                      <RadioGroup>
                        {q.options.map((option, idx) => (
                          <Paper
                            key={idx}
                            elevation={0}
                            onClick={() => selectAnswer(q, idx)}
                            sx={{
                              mb: 1,
                              p: 2,
                              borderRadius: 2,
                              cursor: "pointer",
                              backgroundColor:
                                answers[q.question_id]?.selected_index === idx
                                  ? theme.lightPrimary
                                  : theme.background,
                              border: `1px solid ${
                                answers[q.question_id]?.selected_index === idx
                                  ? theme.primary
                                  : "transparent"
                              }`,
                              transition: "all 0.2s ease",
                              "&:hover": {
                                backgroundColor: theme.lightPrimary,
                                transform: "translateX(4px)",
                              },
                              position: "relative",
                            }}
                          >
                            {answers[q.question_id]?.selected_index === idx && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: -8,
                                  right: -8,
                                  width: 24,
                                  height: 24,
                                  borderRadius: "50%",
                                  backgroundColor: theme.success,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  fontSize: "0.75rem",
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
                                    answers[q.question_id]?.selected_index ===
                                    idx
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
                                <Typography sx={{ color: theme.text }}>
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
                        onClick={() => useHint(q.question_id)}
                        sx={{
                          backgroundColor: theme.lightPrimary,
                          borderRadius: 2,
                          "&.Mui-expanded": {
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0,
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <HintIcon sx={{ mr: 1, color: theme.secondary }} />
                          <Typography
                            sx={{ color: theme.secondary, fontWeight: 500 }}
                          >
                            Need a hint?{" "}
                            {answers[q.question_id]?.used_hint && (
                              <Chip
                                label="Used"
                                size="small"
                                sx={{
                                  ml: 1,
                                  height: 20,
                                  fontSize: "0.7rem",
                                  backgroundColor: theme.primary,
                                  color: "white",
                                }}
                              />
                            )}
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails
                        sx={{
                          backgroundColor: theme.background,
                          borderRadius: "0 0 8px 8px",
                          border: `1px solid ${theme.lightPrimary}`,
                          borderTop: "none",
                        }}
                      >
                        <Typography
                          sx={{ color: theme.text, fontStyle: "italic" }}
                        >
                          {q.hint}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })}

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
                    p: 2,
                    borderRadius: 3,
                    backgroundColor: theme.lightPrimary,
                    width: "100%",
                    maxWidth: 500,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ textAlign: "center", color: theme.primary, mb: 1 }}
                  >
                    ⏱️ Time Summary
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
                        sx={{ color: theme.primary, fontWeight: 700 }}
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
                        Questions Left
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ color: theme.secondary, fontWeight: 700 }}
                      >
                        {quiz.questions.length - getAnsweredCount()}
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
                  py: 1.5,
                  borderRadius: 3,
                  fontSize: "1.1rem",
                  backgroundColor: theme.primary,
                  "&:hover": {
                    backgroundColor: theme.secondary,
                    transform: "translateY(-2px)",
                    boxShadow: `0 6px 20px ${theme.lightPrimary}`,
                  },
                  "&:disabled": {
                    backgroundColor: theme.lightPrimary,
                  },
                  transition: "all 0.3s ease",
                }}
                startIcon={
                  submitting ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <TimerIcon />
                  )
                }
              >
                {submitting
                  ? "Submitting..."
                  : `Submit (${formatTime(timeElapsed)})`}
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
                backgroundColor: result.passed
                  ? `${theme.success}15`
                  : `${theme.error}15`,
                border: `1px solid ${
                  result.passed ? theme.success : theme.error
                }`,
              }}
            >
              {result.passed ? (
                <CheckCircleIcon
                  sx={{ fontSize: 80, color: theme.success, mb: 2 }}
                />
              ) : (
                <ErrorIcon sx={{ fontSize: 80, color: theme.error, mb: 2 }} />
              )}
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {result.passed ? "🎉 Level Passed!" : "❌ Level Not Passed"}
              </Typography>
              <Typography variant="h6" sx={{ color: theme.lightText, mb: 2 }}>
                Quiz Average: {(result.quiz_avg_score * 100).toFixed(0)}%
              </Typography>

              {/* Time Performance */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: "rgba(255,255,255,0.5)",
                  maxWidth: 400,
                  mx: "auto",
                  mt: 2,
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
              <Card sx={{ mb: 4, borderRadius: 3 }}>
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
                    Struggling Lessons
                  </Typography>
                  <List>
                    {result.struggling_lessons.map((lesson, index) => (
                      <Box key={index}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Typography
                                variant="h6"
                                sx={{ color: theme.text }}
                              >
                                {lesson.lesson}
                              </Typography>
                            }
                            secondary={
                              <Typography
                                sx={{ color: theme.lightText, mt: 0.5 }}
                              >
                                Average struggle score:{" "}
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
                  backgroundColor: `${theme.success}15`,
                  color: theme.text,
                }}
                icon={<CheckCircleIcon sx={{ color: theme.success }} />}
              >
                <Typography variant="h6">
                  ✅ No struggling lessons detected!
                </Typography>
                <Typography>
                  Great job! You're mastering all concepts.
                </Typography>
              </Alert>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/quiz/${quiz.level}`)}
                startIcon={<RefreshIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  borderColor: theme.primary,
                  color: theme.primary,
                  "&:hover": {
                    borderColor: theme.secondary,
                    backgroundColor: `${theme.primary}10`,
                  },
                }}
              >
                Retry Level
              </Button>
              {result.passed && (
                <Button
                  variant="contained"
                  onClick={() => navigate(`/quiz/${result.next_level}`)}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    backgroundColor: theme.primary,
                    "&:hover": {
                      backgroundColor: theme.secondary,
                      transform: "translateY(-2px)",
                      boxShadow: `0 6px 20px ${theme.lightPrimary}`,
                    },
                  }}
                >
                  Next Level
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}