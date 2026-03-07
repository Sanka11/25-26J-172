function computeRiskTrend(lastError, currentError, eps = 0.002) {
  if (lastError === null || lastError === undefined) {
    return "STABLE";
  }

  const diff = currentError - lastError;

  if (diff > eps) return "INCREASING";
  if (diff < -eps) return "DECREASING";
  return "STABLE";
}

module.exports = { computeRiskTrend };