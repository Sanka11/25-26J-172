import requests

students = [
    {'id': 'S2001', 'Attendance_pct': 30, 'Midterm_Score': 25, 'Final_Score': 28, 'Assignments_Avg': 30, 'Quizzes_Avg': 28, 'Participation_Score': 15, 'Projects_Score': 20, 'Study_Hours_per_Week': 2, 'Stress_Level': 9, 'Sleep_Hours_per_Night': 4},
    {'id': 'S2002', 'Attendance_pct': 85, 'Midterm_Score': 78, 'Final_Score': 80, 'Assignments_Avg': 82, 'Quizzes_Avg': 79, 'Participation_Score': 75, 'Projects_Score': 83, 'Study_Hours_per_Week': 15, 'Stress_Level': 4, 'Sleep_Hours_per_Night': 7},
    {'id': 'S2003', 'Attendance_pct': 55, 'Midterm_Score': 48, 'Final_Score': 50, 'Assignments_Avg': 52, 'Quizzes_Avg': 47, 'Participation_Score': 40, 'Projects_Score': 45, 'Study_Hours_per_Week': 6, 'Stress_Level': 7, 'Sleep_Hours_per_Night': 5},
    {'id': 'S2004', 'Attendance_pct': 92, 'Midterm_Score': 88, 'Final_Score': 90, 'Assignments_Avg': 91, 'Quizzes_Avg': 87, 'Participation_Score': 85, 'Projects_Score': 92, 'Study_Hours_per_Week': 20, 'Stress_Level': 3, 'Sleep_Hours_per_Night': 8},
    {'id': 'S2005', 'Attendance_pct': 40, 'Midterm_Score': 35, 'Final_Score': 32, 'Assignments_Avg': 38, 'Quizzes_Avg': 33, 'Participation_Score': 20, 'Projects_Score': 28, 'Study_Hours_per_Week': 3, 'Stress_Level': 8, 'Sleep_Hours_per_Night': 4},
    {'id': 'S2006', 'Attendance_pct': 70, 'Midterm_Score': 65, 'Final_Score': 68, 'Assignments_Avg': 70, 'Quizzes_Avg': 63, 'Participation_Score': 60, 'Projects_Score': 67, 'Study_Hours_per_Week': 10, 'Stress_Level': 6, 'Sleep_Hours_per_Night': 6},
    {'id': 'S2007', 'Attendance_pct': 25, 'Midterm_Score': 20, 'Final_Score': 18, 'Assignments_Avg': 22, 'Quizzes_Avg': 19, 'Participation_Score': 10, 'Projects_Score': 15, 'Study_Hours_per_Week': 1, 'Stress_Level': 10, 'Sleep_Hours_per_Night': 3},
    {'id': 'S2008', 'Attendance_pct': 95, 'Midterm_Score': 92, 'Final_Score': 94, 'Assignments_Avg': 95, 'Quizzes_Avg': 91, 'Participation_Score': 90, 'Projects_Score': 96, 'Study_Hours_per_Week': 25, 'Stress_Level': 2, 'Sleep_Hours_per_Night': 8},
    {'id': 'S2009', 'Attendance_pct': 60, 'Midterm_Score': 55, 'Final_Score': 52, 'Assignments_Avg': 58, 'Quizzes_Avg': 53, 'Participation_Score': 45, 'Projects_Score': 50, 'Study_Hours_per_Week': 7, 'Stress_Level': 7, 'Sleep_Hours_per_Night': 5},
    {'id': 'S2010', 'Attendance_pct': 88, 'Midterm_Score': 82, 'Final_Score': 85, 'Assignments_Avg': 84, 'Quizzes_Avg': 80, 'Participation_Score': 78, 'Projects_Score': 86, 'Study_Hours_per_Week': 18, 'Stress_Level': 3, 'Sleep_Hours_per_Night': 8},
]

BASE = 'https://predictriskshap-z33gthyxyq-uc.a.run.app'

for s in students:
    payload = {
        'studentId': s['id'],
        'Attendance_pct': s['Attendance_pct'],
        'Midterm_Score': s['Midterm_Score'],
        'Final_Score': s['Final_Score'],
        'Assignments_Avg': s['Assignments_Avg'],
        'Quizzes_Avg': s['Quizzes_Avg'],
        'Participation_Score': s['Participation_Score'],
        'Projects_Score': s['Projects_Score'],
        'Age': 21,
        'Study_Hours_per_Week': s['Study_Hours_per_Week'],
        'Stress_Level': s['Stress_Level'],
        'Sleep_Hours_per_Night': s['Sleep_Hours_per_Night'],
        'Gender': 'Male',
        'Department': 'CS',
        'Extracurricular_Activities': 'No',
        'Internet_Access_at_Home': 'Yes',
        'Parent_Education_Level': 'Bachelor',
        'Family_Income_Level': 'Middle',
    }
    r = requests.post(BASE, json=payload)
    data = r.json()
print(f"{s['id']} -> {r.status_code} -> {r.text[:200]}")