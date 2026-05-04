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

# X = df_ml.drop(columns=['recommendation_label'])
# y = df_ml['recommendation_label']

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





# import pandas as pd
# import numpy as np
# import joblib
# import os
# from sklearn.preprocessing import StandardScaler
# from sklearn.compose import ColumnTransformer
# from sklearn.pipeline import Pipeline
# from sklearn.ensemble import RandomForestRegressor
# from sklearn.multioutput import MultiOutputRegressor

# # 1️⃣ Loading dataset
# csv_path = 'D:/Y4S2/Y4S2/Student_Performance_With_Index.csv' 

# try:
#     df = pd.read_csv(csv_path)
#     print(f"✅ Dataset loaded: {df.shape}")
# except FileNotFoundError:
#     print(f"❌ ERROR: Could not find the file at: {csv_path}")
#     exit()

# # 2️⃣ Ethical Data Filtering (No Demographics)
# # We drop demographics/socio-economics per your requirement for ethical outcomes
# columns_to_drop = [
#     'Student_ID', 'First_Name', 'Last_Name', 'Email', 
#     'Final_Score', 'Total_Score', 'Grade', 'risk_score_cont', 'ml_risk_score',
#     'Internet_Access_at_Home', 'Parent_Education_Level', 'Family_Income_Level', 'Gender', 'Age',
#     'Department', 'risk_label' # Dropping risk_label because we are predicting indices now
# ]

# existing_drops = [col for col in columns_to_drop if col in df.columns]
# df_ml = df.drop(columns=existing_drops)

# # 3️⃣ Define Features and Targets
# # To support your dual-index logic, we calculate targets if they aren't in your CSV
# if 'wellbeing_index' not in df_ml.columns:
#     # Example logic using your behavioral columns
#     df_ml['wellbeing_index'] = (df['Sleep_Hours_per_Night'] / 9 * 0.6) + ((10 - df['Stress_Level_1-10']) / 10 * 0.4)
#     df_ml['study_index'] = (df['Attendance_pct'] / 100 * 0.4) + (df['Study_Hours_per_Week'] / 40 * 0.6)

# X = df_ml.drop(columns=['wellbeing_index', 'study_index'])
# y = df_ml[['wellbeing_index', 'study_index']]

# print(f"3️⃣ Training features: {list(X.columns)}")

# # 4️⃣ Building the Multi-Output Pipeline
# numeric_features = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
# preprocessor = ColumnTransformer(transformers=[('num', StandardScaler(), numeric_features)])

# # Using Regressor instead of Classifier to get the 0.0-1.0 indices
# base_model = RandomForestRegressor(n_estimators=150, max_depth=10, random_state=42)
# multi_model = MultiOutputRegressor(base_model)

# clf = Pipeline(steps=[
#     ('preprocessor', preprocessor),
#     ('regressor', multi_model)
# ])

# print("4️⃣ Training Multi-Output Regressor...")
# clf.fit(X, y)

# # 5️⃣ Saving the model (matching your service filename)
# os.makedirs('app/models', exist_ok=True)
# save_path = 'app/models/student_model.pkl' # This matches your admin_recommendations.py
# joblib.dump(clf, save_path)

# print(f"✅ SUCCESS! Model saved to: {save_path}")