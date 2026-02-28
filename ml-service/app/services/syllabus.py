COURSE_SYLLABUS = {
    "OOP": {
        "week_1": {"module": "Intro to OOP & Classes", "assessment": "None", "key_concepts": "Classes, Objects, Attributes"},
        "week_2": {"module": "Encapsulation & Abstraction", "assessment": "Quiz 1", "key_concepts": "Getters, Setters, Access Modifiers"},
        "week_3": {"module": "Inheritance", "assessment": "Assignment 1 (Due Sunday)", "key_concepts": "Superclasses, Subclasses, Method Overriding"},
        "week_4": {"module": "Polymorphism & Interfaces", "assessment": "Midterm Exam", "key_concepts": "Dynamic Binding, Abstract Classes"}
    },
    "SOFTWARE_ARCHITECTURE": {
        "week_1": {"module": "Intro to Architecture & Quality Attributes", "assessment": "None", "key_concepts": "Scalability, Maintainability, Performance"},
        "week_2": {"module": "Architectural Patterns", "assessment": "Quiz 1", "key_concepts": "Client-Server, MVC, Layered Architecture"},
        "week_3": {"module": "Microservices vs. Monoliths", "assessment": "Architecture Diagram Draft", "key_concepts": "API Gateways, Service Discovery, Coupling"},
        "week_4": {"module": "Event-Driven Architecture", "assessment": "Midterm Exam", "key_concepts": "Message Queues, Pub/Sub, Kafka"}
    },
    "DATABASE_MANAGEMENT": {
        "week_1": {"module": "Relational Data Models", "assessment": "None", "key_concepts": "Tables, Primary Keys, Foreign Keys"},
        "week_2": {"module": "ER Diagrams & Normalization", "assessment": "Quiz 1", "key_concepts": "1NF, 2NF, 3NF, Boyce-Codd Normal Form"},
        "week_3": {"module": "Advanced SQL Queries", "assessment": "SQL Assignment", "key_concepts": "JOINs, Subqueries, Window Functions"},
        "week_4": {"module": "NoSQL & MongoDB", "assessment": "Midterm Exam", "key_concepts": "Document Stores, JSON, Collections"}
    },
    "DATA_STRUCTURES": {
        "week_1": {"module": "Arrays & Strings", "assessment": "None", "key_concepts": "Memory Allocation, Big-O Time Complexity"},
        "week_2": {"module": "Linked Lists", "assessment": "Quiz 1", "key_concepts": "Singly vs Doubly Linked, Pointers"},
        "week_3": {"module": "Stacks & Queues", "assessment": "Coding Assignment 1", "key_concepts": "LIFO, FIFO, Push/Pop"},
        "week_4": {"module": "Trees & Graphs", "assessment": "Midterm Exam", "key_concepts": "Binary Search Trees, DFS, BFS"}
    }
}

def get_syllabus_context(subject_code, week_number):
    """
    Fetches the specific syllabus data for a given subject and week.
    If the week or subject doesn't exist, it returns a safe default.
    """
    week_key = f"week_{week_number}"
    
    # Safely get the subject, default to an empty dictionary if not found
    subject_data = COURSE_SYLLABUS.get(subject_code.upper(), {})
    
    # Safely get the week data, default to generic info if not found
    weekly_data = subject_data.get(week_key, {
        "module": "General Course Review",
        "assessment": "Upcoming Assessment",
        "key_concepts": "Review of Core Topics"
    })
    
    return weekly_data