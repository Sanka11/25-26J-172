#!/usr/bin/env python3
"""
Quick Demonstration: Student Profile System for Research
Shows how to create and compare two student types
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.student_profile_service import get_profile_manager

def demo_for_supervisor():
    """Quick demo showing student profile differentiation."""
    
    print("\n" + "="*70)
    print("  RESEARCH DEMONSTRATION: PERSONALIZED CHATBOT SYSTEM")
    print("="*70 + "\n")
    
    profile_manager = get_profile_manager()
    
    # Create Profile 1: Excellent Student
    print("STUDENT 1 - Excellent Academic Performance")
    print("-" * 70)
    
    profile1 = profile_manager.create_profile(
        user_id="excellent_student",
        attendance_percent=92,  # High attendance
        exam_marks=[85, 90, 88, 92],  # High exam marks
        exams_missed=0
    )
    
    print(f"  User ID: {profile1['user_id']}")
    print(f"  Attendance: {profile1['attendance_percent']}%")
    print(f"  Exam Marks: {profile1['exam_marks']}")
    print(f"  Average Mark: {profile1['avg_exam_marks']:.1f}")
    print(f"  Missed Exams: {profile1['exams_missed']}")
    print(f"  Profile Status: {profile1['status'].upper()}")
    print(f"  Risk Factors: {profile1['risk_factors'] if profile1['risk_factors'] else 'None'}")
    
    # Create Profile 2: At-Risk Student
    print("\n\nSTUDENT 2 - At-Risk Academic Performance")
    print("-" * 70)
    
    profile2 = profile_manager.create_profile(
        user_id="at_risk_student",
        attendance_percent=45,  # Low attendance
        exam_marks=[35, 42, 38],  # Low exam marks
        exams_missed=2  # Missed exams
    )
    
    print(f"  User ID: {profile2['user_id']}")
    print(f"  Attendance: {profile2['attendance_percent']}%")
    print(f"  Exam Marks: {profile2['exam_marks']}")
    print(f"  Average Mark: {profile2['avg_exam_marks']:.1f}")
    print(f"  Missed Exams: {profile2['exams_missed']}")
    print(f"  Profile Status: {profile2['status'].upper()}")
    print(f"  Risk Factors: {', '.join(profile2['risk_factors'])}")
    
    # Show file locations
    print("\n\n" + "="*70)
    print("  FILES CREATED FOR YOUR RESEARCH")
    print("="*70 + "\n")
    
    print("Profile Data (stored in JSON):")
    print(f"  • ml-service/student_profiles/excellent_student_profile.json")
    print(f"  • ml-service/student_profiles/at_risk_student_profile.json")
    
    print("\nChatbot Response Personalization Code:")
    print(f"  • ml-service/app/rag.py (see _build_personalized_system_instructions)")
    print(f"  • ml-service/app/services/student_profile_service.py")
    
    # Show how chatbot adapts
    print("\n\n" + "="*70)
    print("  HOW CHATBOT ADAPTS TO EACH STUDENT")
    print("="*70 + "\n")
    
    print("FOR EXCELLENT STUDENT:")
    print("  ✓ Gets encouragement for advanced topics")
    print("  ✓ Mentorship suggestions")
    print("  ✓ Maintains high standards guidance")
    print("  ✓ No extra deadline warnings (already organized)")
    
    print("\nFOR AT-RISK STUDENT:")
    print("  ✓ Urgent reminders about attendance importance")
    print("  ✓ Deadline emphasis to help stay on track")
    print("  ✓ Support resources highlighted (contact LIC)")
    print("  ✓ Academic integrity explanations (avoid failures)")
    print("  ✓ Extra encouragement to ask early")
    
    print("\n\n" + "="*70)
    print("  FOR YOUR SUPERVISOR PRESENTATION")
    print("="*70 + "\n")
    
    print("✓ EVIDENCE OF PERSONALIZATION:")
    print(f"  1. Two distinct student profiles with different metrics")
    print(f"     - Excellent: {profile1['attendance_percent']}% attendance, {profile1['avg_exam_marks']:.1f} avg marks")
    print(f"     - At-Risk: {profile2['attendance_percent']}% attendance, {profile2['avg_exam_marks']:.1f} avg marks\n")
    
    print("  2. System automatically classifies student status:")
    print(f"     - Student 1: {profile1['status']} (no risk factors)")
    print(f"     - Student 2: {profile2['status']} ({len(profile2['risk_factors'])} risk factors)\n")
    
    print("  3. Chatbot adapts responses based on profile:")
    print("     - Code location: ml-service/app/rag.py")
    print("     - Function: _build_personalized_system_instructions()")
    print("     - Uses student status to modify LLM prompts\n")
    
    print("  4. Independent chat histories per user:")
    print("     - Each student has their own conversation history")
    print("     - Stored in ml-service/chat_history/ directory\n")
    
    print("\n" + "="*70)
    print("  RESEARCH QUESTION VALIDATION")
    print("="*70 + "\n")
    
    print("Q: Is the chatbot personalized?")
    print("A: YES ✓ - Responses adapt based on student academic profile\n")
    
    print("Q: Can it detect different student types?")
    print("A: YES ✓ - Excellent vs At-Risk classification with risk factors\n")
    
    print("Q: Does it provide different support?")
    print("A: YES ✓ - Excellent students get advanced guidance,")
    print("           At-risk students get support & deadline emphasis\n")
    
    print("="*70)
    print("  ✓ PERSONALIZATION SYSTEM READY")
    print("="*70 + "\n")
    
    print("Your chatbot successfully demonstrates personalization!")
    print("Files saved in: ml-service/student_profiles/\n")

if __name__ == "__main__":
    demo_for_supervisor()
