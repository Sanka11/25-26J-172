# import pandas as pd
# from sklearn.preprocessing import StandardScaler, OneHotEncoder
# from sklearn.compose import ColumnTransformer
# from sklearn.pipeline import Pipeline
# from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
# from sklearn.linear_model import LogisticRegression
# import joblib
# import os

# print("1️⃣ Loading dataset...")
# # 👇 UPDATE THIS PATH if your CSV is in a different folder 👇
# # Example: csv_path = r'C:\Users\HP\Downloads\Processed_Student_Performance.csv'
# csv_path = 'D:/Y4S1/Research_2025/before_reserchpaper/Processed_Student_Performance.csv' 

# try:
#     df = pd.read_csv(csv_path)
# except FileNotFoundError:
#     print(f"❌ ERROR: Could not find the file at: {csv_path}")
#     print("Please copy the exact full path of your CSV file and update 'csv_path' on Line 13.")
#     exit()

# # Drop identifiers, data leakage, demographics, AND the newly removed features
# columns_to_drop = [
#     # Identifiers
#     'Student_ID', 'First_Name', 'Last_Name', 'Email', 
#     # Data Leakage
#     'Final_Score', 'Total_Score', 'Grade', 'risk_score_cont', 'ml_risk_score',
#     # Demographics & Socio-economic
#     'Internet_Access_at_Home', 'Parent_Education_Level', 'Family_Income_Level', 'Gender', 'Age',
#     # Newly removed features (Not highly impactful for this specific recommendation logic)
#     'Extracurricular_Activities', 'Participation_Score', 'Department', 'Sleep_Hours_per_Night'
# ]

# # Only drop columns that actually exist in the dataframe to prevent errors
# existing_columns_to_drop = [col for col in columns_to_drop if col in df.columns]
# df_ml = df.drop(columns=existing_columns_to_drop)

# X = df_ml.drop(columns=['risk_label'])
# y = df_ml['risk_label']

# print("2️⃣ Building the Hybrid Pipeline...")
# # Dynamically identify numeric and categorical columns
# numeric_features = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
# categorical_features = X.select_dtypes(include=['object']).columns.tolist()

# # Build the transformers list dynamically 
# # (Since we dropped all text columns, categorical_features will be empty)
# transformers = [('num', StandardScaler(), numeric_features)]

# if len(categorical_features) > 0:
#     transformers.append(('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features))

# preprocessor = ColumnTransformer(transformers=transformers)

# # Define the 3 base models
# model_rf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
# model_gb = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, random_state=42)
# model_lr = LogisticRegression(max_iter=1000, random_state=42)

# # Combine them into a Hybrid Voting Classifier
# hybrid_model = VotingClassifier(
#     estimators=[
#         ('Random_Forest', model_rf), 
#         ('Gradient_Boosting', model_gb), 
#         ('Logistic_Regression', model_lr)
#     ],
#     voting='soft'
# )

# # Create the final Pipeline
# clf = Pipeline(steps=[
#     ('preprocessor', preprocessor),
#     ('classifier', hybrid_model)
# ])

# print("3️⃣ Training model on refined data...")
# clf.fit(X, y)

# print("4️⃣ Saving the model for FastAPI...")
# # Create the app/models folder if it doesn't exist
# os.makedirs('app/models', exist_ok=True)

# # Save the model directly to your app/models folder
# save_path = 'app/models/recommendation_engine_model.pkl'
# joblib.dump(clf, save_path)

# print(f"✅ SUCCESS! Model retrained and saved to: {save_path}")
# print("You can now start your FastAPI server!")