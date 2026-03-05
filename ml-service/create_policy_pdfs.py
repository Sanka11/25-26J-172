"""Generate standard policy PDFs for download"""
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.units import inch
import os

# Create uploaded_pdfs folder if it doesn't exist
upload_dir = os.path.join(os.path.dirname(__file__), "uploaded_pdfs")
os.makedirs(upload_dir, exist_ok=True)

# Define policy content
policies = {
    "library_policies.pdf": {
        "title": "SLIIT Library Rules & Policies",
        "content": """
Borrowing Regulations:
• Students can borrow up to 5 books at a time per card
• Loan period: 14 days for general books, 7 days for reference materials
• Renewals: Available for 2 additional periods if no other user has placed a hold
• Reserved materials: 3-hour loan period (in library only)

Late Fees & Penalties:
• Overdue books: Rs. 5 per day per book (maximum Rs. 50/book)
• Lost books: Full replacement cost + processing fee
• Damaged books: Assessed fees based on extent of damage

Library Hours:
• Weekdays: 8:00 AM - 6:00 PM
• Saturdays: 9:00 AM - 4:00 PM
• Sundays: CLOSED
• Holiday closures: Follow university academic calendar

Facilities & Services:
• Free Wi-Fi access in all library areas
• Computer lab with 30+ workstations
• Print/photocopy services available
• Inter-library loan available upon request
• Study areas: Individual carrels and group study rooms

Collection Management:
• New books catalogued within 2 weeks of receipt
• Online catalog available 24/7 at library.sliit.edu.lk
• Request for acquisition of specific titles encouraged
• Lost and Found: Inquire at main desk
        """
    },
    "student_handbook.pdf": {
        "title": "SLIIT Student Conduct Code & Dress Code Policy",
        "content": """
Expected Standards of Conduct:
• Treat all community members with respect and dignity
• Attend classes punctually and maintain professional behavior
• Refrain from disruptive or disrespectful behavior
• Follow all academic and administrative regulations
• Maintain integrity in all academic work

Dress Code Requirements:
• Business casual for campus and official university events
• No revealing clothing, offensive graphics, or inappropriate attire
• Specific programs may have additional professional dress codes
• Athletic wear permitted only in sports/recreation areas

Attendance Policy:
• Minimum 75% attendance required per course (varies by program)
• Unexplained absences may result in grade deductions
• Medical/compassionate absences: Provide documentation within 5 days
• More than 10 consecutive absences may result in course withdrawal

Disciplinary Process:
• Minor infractions: Verbal warning from instructor/staff
• Moderate violations: Written warning and meeting with Student Affairs
• Serious violations: Hearing with disciplinary committee
• Appeals process available within 7 days of decision
        """
    },
    "academic_integrity.pdf": {
        "title": "Academic Integrity Policy",
        "content": """
What is Academic Dishonesty?
• Plagiarism: Submitting someone else's work as your own
• Cheating: Using unauthorized resources during exams
• Fabrication: Making up data or sources
• Collusion: Submitting identical work without authorization
• Contract cheating: Having someone else do your work

Plagiarism Prevention:
• Always cite sources using the required format (APA, Harvard, etc.)
• Use quotation marks for direct quotes
• Paraphrase properly and cite the original source
• Build in time to ask instructors if you're unsure
• Use plagiarism detection tools (e.g., Turnitin)

Consequences of Academic Dishonesty:
• First offense: Zero for assignment + formal warning
• Second offense: Failure in the course + disciplinary review
• Serious/repeated violations: Suspension or expulsion

Resources:
• Contact your Lecturer in Charge for guidance
• Attend academic integrity workshops (offered each semester)
• Visit Student Support Center for help with writing and research
• Use university library guides for proper citation formatting
        """
    },
    "fee_structure.pdf": {
        "title": "SLIIT Fee Structure & Payment Information",
        "content": """
Tuition Fees (per semester):
• Undergraduate programs: Rs. 180,000 - 250,000
• Postgraduate programs: Rs. 250,000 - 400,000
• Additional fees vary by program specialization

Other Charges:
• Registration fee: Rs. 2,500 (one-time)
• Library fee: Rs. 1,500 per semester
• IT/Lab fee: Rs. 3,000 per semester
• Student ID card: Rs. 500 (replacement: Rs. 1,000)
• Examination fee: Included in tuition

Payment Terms & Deadlines:
• Semester fees due within 2 weeks of semester start
• Payment methods: Bank transfer, credit/debit cards, cash
• Installment plans: Available upon request (3-4 installments)
• Late payment penalty: Rs. 500 after due date

Refund Policy:
• Withdrawal within 2 weeks: 80% refund
• Withdrawal within 4 weeks: 60% refund
• Withdrawal after 4 weeks: No refund (except lab fees)
• Medical/extenuating circumstances: Assessed case-by-case

Financial Assistance:
• Merit scholarships: Up to 50% tuition
• Need-based assistance: Available to qualifying students
• Student employment opportunities: On-campus work available
• Educational loans: Partnerships with authorized institutions
        """
    },
    "academic_calendar.pdf": {
        "title": "Academic Calendar 2025-2026",
        "content": """
Semester 1 (January - April 2026):
• Start: January 5, 2026
• Mid-semester break: February 16-20, 2026
• End: April 24, 2026
• Exam period: May 4-22, 2026

Semester 2 (May - August 2026):
• Start: May 25, 2026
• Mid-semester break: July 13-17, 2026
• End: August 28, 2026
• Exam period: September 7-25, 2026

Important Deadlines:
• Module registration: 1st week of each semester
• Payment deadline: 2nd week of each semester
• Assignment submission deadlines: Per course syllabus
• Course withdrawal: Before mid-semester evaluation

University Holidays:
• Colombo Independence Day: February 4, 2026
• Sinhala/Tamil New Year: April 13-14, 2026
• Spring Break: May 1-3, 2026
• Mid-year break: August 29 - September 6, 2026
• Additional holidays as declared by the university

Classroom Schedules:
• Full-time students: Classes Monday - Friday, 8:30 AM - 5:30 PM
• Part-time students: Classes evenings/weekends as assigned
• Weekend intensives: Available for selected programs
• Online/Hybrid options: Available for some courses
        """
    }
}

# Create PDFs
try:
    from reportlab.pdfgen import canvas
    
    for filename, policy_data in policies.items():
        filepath = os.path.join(upload_dir, filename)
        
        # Create a simple PDF using canvas
        c = canvas.Canvas(filepath, pagesize=letter)
        width, height = letter
        
        # Add title
        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, height - 50, policy_data["title"])
        
        # Add content
        y_position = height - 100
        c.setFont("Helvetica", 10)
        
        for line in policy_data["content"].strip().split('\n'):
            if y_position < 50:
                c.showPage()
                y_position = height - 50
                c.setFont("Helvetica", 10)
            
            c.drawString(50, y_position, line.strip())
            y_position -= 12
        
        c.save()
        print(f"✓ Created {filename}")
        
except Exception as e:
    print(f"Error creating PDFs: {e}")
    print("Installing reportlab...")
    os.system("pip install reportlab")
    print("Please run this script again.")

print(f"\n✅ All policy PDFs created in: {upload_dir}")
