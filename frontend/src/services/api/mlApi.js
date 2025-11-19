import axios from "axios";
import { appConfig } from "../../config/env";

export async function predictRiskScore(input) {
  const response = await axios.post(appConfig.PREDICT_RISK_URL, input);
  return response.data; // { risk_score: number }
}
