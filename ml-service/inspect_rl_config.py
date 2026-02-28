import joblib

cfg = joblib.load("app/disengagement/rl_config.pkl")

print("TYPE:", type(cfg))
print("CONTENT:")
print(cfg)
