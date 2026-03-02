# from fastapi import APIRouter, HTTPException
# from app.rl.rl_simulation_live import run_live_rl_decision

# router = APIRouter(
#     prefix="/rl",
#     tags=["Reinforcement Learning"]
# )

# @router.get("/decide/{student_id}")
# def decide_rl(student_id: str):
#     """
#     Live RL decision endpoint.
#     GRU logic is reused internally.
#     """
#     try:
#         return run_live_rl_decision(student_id)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
