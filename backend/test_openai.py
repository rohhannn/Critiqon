from app.services.ai_service import analyze_resume

result = analyze_resume("""
Python Developer

Skills:
Python
FastAPI
React
SQL

Projects:
AI Resume Analyzer
""")

print(result)