from fastapi import APIRouter, HTTPException
from app.rl.rl_simulation_live import run_live_rl_decision

router = APIRouter(prefix="/rl", tags=["RL"])


@router.get("/decide/{student_id}")
def decide_rl_action(student_id: str):
    """
    Live RL decision endpoint.
    Calls the SAME logic used in rl_simulation_live.py
    """

    try:
        result = run_live_rl_decision(student_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
