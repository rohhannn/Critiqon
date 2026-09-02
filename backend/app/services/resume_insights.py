import re

TECH_SKILLS = [
    "python","java","c","c++","javascript","typescript",
    "html","css","react","node","express","fastapi",
    "django","flask","sql","mysql","postgresql","mongodb",
    "git","github","linux","docker","kubernetes","aws",
    "azure","gcp","tensorflow","pytorch","opencv",
    "machine learning","deep learning","nlp",
    "data analysis","scikit-learn",
]

CERTIFICATION_KEYWORDS = [
    "coursera",
    "ibm",
    "oracle",
    "udemy",
    "certification",
    "certificate",
    "ielts",
]

PROJECT_KEYWORDS = [
    "project",
    "developed",
    "built",
    "implemented",
]

EDUCATION_KEYWORDS = [
    "bachelor",
    "engineering",
    "computer engineering",
    "b.tech",
    "be",
    "master",
    "m.tech",
]

EXPERIENCE_KEYWORDS = [
    "experience",
    "intern",
    "internship",
    "worked",
    "software engineer",
    "developer",
]


def extract_resume_insights(
    text: str,
    pages: int,
    ats_score: int,
):

    text_lower = text.lower()

    # ---------------- Skills ----------------

    found_skills = [
        skill
        for skill in TECH_SKILLS
        if skill in text_lower
    ]

    # ---------------- Certifications ----------------

    certifications = sum(
        len(re.findall(word, text_lower))
        for word in CERTIFICATION_KEYWORDS
    )

    # ---------------- Projects ----------------

    projects = sum(
        len(re.findall(word, text_lower))
        for word in PROJECT_KEYWORDS
    )

    projects = max(projects, 1)

    # ---------------- Education ----------------

    education = sum(
        len(re.findall(word, text_lower))
        for word in EDUCATION_KEYWORDS
    )

    education = max(education, 1)

    # ---------------- Experience ----------------

    experience = any(
        word in text_lower
        for word in EXPERIENCE_KEYWORDS
    )

    experience_level = (
        "Experienced"
        if experience
        else "Fresher"
    )

    # ---------------- Word Count ----------------

    words = len(text.split())

    # ---------------- Reading Time ----------------

    reading_time = max(
        1,
        round(words / 200),
    )

    # ---------------- ATS Grade ----------------

    if ats_score >= 90:
        grade = "A+"
    elif ats_score >= 80:
        grade = "A"
    elif ats_score >= 70:
        grade = "B+"
    elif ats_score >= 60:
        grade = "B"
    else:
        grade = "C"

    return {
        "pages": pages,
        "words": words,
        "reading_time": reading_time,
        "skills": len(found_skills),
        "projects": projects,
        "certifications": certifications,
        "education": education,
        "experience": experience_level,
        "ats_grade": grade,
    }