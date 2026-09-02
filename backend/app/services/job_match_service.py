import json

from openai import OpenAI

from ..config import OPENAI_API_KEY, OPENAI_MODEL


def _client() -> OpenAI:
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not configured on the server.")
    return OpenAI(api_key=OPENAI_API_KEY, timeout=60.0, max_retries=2)


# =========================================================
# HELPERS
# =========================================================

def clean_list(value):
    """
    Convert an AI response value into a clean,
    unique list of strings.
    """

    if value is None:
        return []

    if isinstance(value, str):
        value = value.strip()

        if not value:
            return []

        if "\n" in value:
            items = value.split("\n")

        elif "," in value:
            items = value.split(",")

        else:
            items = [value]

    elif isinstance(value, list):
        items = value

    else:
        return []

    result = []
    seen = set()

    for item in items:

        item = str(item).strip()

        # Remove common bullet formatting
        item = item.lstrip("-•*").strip()

        if not item:
            continue

        key = item.lower()

        if key not in seen:
            seen.add(key)
            result.append(item)

    return result


def clean_score(value):
    """
    Safely convert an AI-generated score into
    an integer between 0 and 100.
    """

    try:

        score = int(float(value))

    except (
        TypeError,
        ValueError,
    ):

        return 0

    return max(
        0,
        min(
            100,
            score,
        ),
    )


def unique_case_insensitive(items):
    """
    Remove duplicate values without
    changing original capitalization.
    """

    result = []
    seen = set()

    for item in items:

        item = str(item).strip()

        if not item:
            continue

        key = item.lower()

        if key not in seen:

            seen.add(key)
            result.append(item)

    return result


# =========================================================
# MAIN JOB MATCH FUNCTION
# =========================================================

def analyze_job_match(
    resume_text: str,
    job_description: str,
):

    # =====================================================
    # VALIDATION
    # =====================================================

    if not resume_text or not resume_text.strip():

        raise ValueError(
            "Resume text is empty."
        )

    if not job_description or not job_description.strip():

        raise ValueError(
            "Job description is empty."
        )


    # =====================================================
    # AI PROMPT
    # =====================================================

    prompt = f"""
You are an expert technical recruiter,
ATS evaluator, and hiring analyst.

Your task is to compare a candidate's resume
against a specific job description.

Be strict, evidence-based, and conservative.

=========================================================
CORE RULES
=========================================================

1. Read the COMPLETE resume.

2. Read the COMPLETE job description.

3. Identify the technical and professional skills
   explicitly requested by the job.

4. Separate requirements into:

   - required_skills
   - preferred_skills

5. A skill is MATCHED only if the resume contains
   actual evidence of that skill.

6. Do NOT infer skills from related technologies.

Examples:

Python != FastAPI

Python != Django

JavaScript != React

JavaScript != Node.js

SQL != PostgreSQL

SQL != MySQL

Git != GitHub Actions

Git != CI/CD

Machine Learning != Deep Learning

Deep Learning != NLP

AWS != Azure

AWS != GCP

7. Projects count as evidence if the resume clearly
   demonstrates that the candidate actually used
   the technology.

8. A course, certificate, or vague mention should NOT
   automatically be treated as professional experience.

9. Do NOT invent years of experience.

10. Do NOT invent education.

11. Do NOT assume a candidate satisfies a requirement
    simply because they have a related degree.

12. Only include skills that are relevant to this
    particular job description.

13. Do NOT include unrelated resume skills.

=========================================================
EXPERIENCE MATCH
=========================================================

Return experience_match from 0 to 100.

Use:

100:
Candidate clearly satisfies or exceeds the experience
requirements.

75-99:
Candidate mostly satisfies the experience requirements
with minor gaps.

50-74:
Candidate has some relevant experience but significant
gaps remain.

25-49:
Candidate has limited relevant experience.

0-24:
Candidate has almost no evidence of the required
experience.

Base this ONLY on evidence in the resume.

=========================================================
EDUCATION MATCH
=========================================================

Return education_match from 0 to 100.

100:
Education clearly satisfies the job requirement.

75-99:
Education is strongly relevant with a minor difference.

50-74:
Education is somewhat related.

25-49:
Education has weak relevance.

0-24:
Education does not satisfy the stated requirement.

Do not invent degrees or qualifications.

=========================================================
SUGGESTIONS
=========================================================

Provide practical suggestions that would improve
the candidate's chances for THIS job.

Suggestions can include:

- Missing technical skills
- Missing experience
- Missing projects
- Resume improvements
- Certifications
- Technologies to learn
- Areas that need stronger evidence

Do not give generic advice when a specific recommendation
can be made.

=========================================================
RECOMMENDATION
=========================================================

Give a concise hiring-style recommendation.

Examples:

"Strong match. The candidate satisfies most required
technical skills and has relevant project experience."

"Moderate match. The candidate has several relevant
skills but is missing important required technologies."

"Weak match. The candidate lacks several core
requirements for this position."

Base the recommendation on the actual evidence.

=========================================================
RESUME
=========================================================

{resume_text}

=========================================================
JOB DESCRIPTION
=========================================================

{job_description}

=========================================================
OUTPUT
=========================================================

Return ONLY valid JSON.

Return EXACTLY this structure:

{{
    "required_skills": [],

    "preferred_skills": [],

    "matched_required_skills": [],

    "matched_preferred_skills": [],

    "missing_required_skills": [],

    "missing_preferred_skills": [],

    "experience_match": 0,

    "education_match": 0,

    "suggestions": [],

    "recommendation": ""
}}

Every skill field MUST be an array of strings.

experience_match MUST be an integer from 0 to 100.

education_match MUST be an integer from 0 to 100.

Do not add additional fields.
"""


    # =====================================================
    # OPENAI REQUEST
    # =====================================================

    response = _client().chat.completions.create(

        model=OPENAI_MODEL,

        messages=[

            {
                "role": "system",
                "content": (
                    "You are a strict technical recruiter. "
                    "Use only evidence explicitly present "
                    "in the resume and job description. "
                    "Never invent skills, experience, "
                    "education, or qualifications. "
                    "Return valid JSON only."
                ),
            },

            {
                "role": "user",
                "content": prompt,
            },

        ],

        response_format={
            "type": "json_object"
        },
    )


    # =====================================================
    # READ RESPONSE
    # =====================================================

    content = (
        response
        .choices[0]
        .message
        .content
    )

    if not content:

        raise ValueError(
            "AI returned an empty response."
        )

    content = content.strip()


    # =====================================================
    # REMOVE MARKDOWN CODE FENCE IF PRESENT
    # =====================================================

    if content.startswith("```"):

        content = (
            content
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )


    # =====================================================
    # PARSE JSON
    # =====================================================

    try:

        data = json.loads(
            content
        )

    except json.JSONDecodeError as error:

        print(
            "Invalid AI JSON:",
            content,
        )

        raise ValueError(
            f"AI returned invalid JSON: {error}"
        )


    # =====================================================
    # EXTRACT SKILLS
    # =====================================================

    required = unique_case_insensitive(
        clean_list(
            data.get(
                "required_skills",
                [],
            )
        )
    )

    preferred = unique_case_insensitive(
        clean_list(
            data.get(
                "preferred_skills",
                [],
            )
        )
    )

    matched_required = unique_case_insensitive(
        clean_list(
            data.get(
                "matched_required_skills",
                [],
            )
        )
    )

    matched_preferred = unique_case_insensitive(
        clean_list(
            data.get(
                "matched_preferred_skills",
                [],
            )
        )
    )


    # =====================================================
    # VALIDATE MATCHED SKILLS
    # =====================================================

    required_lower = {
        skill.lower()
        for skill in required
    }

    preferred_lower = {
        skill.lower()
        for skill in preferred
    }


    matched_required = [
        skill

        for skill in matched_required

        if skill.lower()
        in required_lower
    ]


    matched_preferred = [
        skill

        for skill in matched_preferred

        if skill.lower()
        in preferred_lower
    ]


    # =====================================================
    # CALCULATE MISSING SKILLS
    # =====================================================

    matched_required_lower = {
        skill.lower()
        for skill in matched_required
    }

    matched_preferred_lower = {
        skill.lower()
        for skill in matched_preferred
    }


    missing_required = [
        skill

        for skill in required

        if skill.lower()
        not in matched_required_lower
    ]


    missing_preferred = [
        skill

        for skill in preferred

        if skill.lower()
        not in matched_preferred_lower
    ]


    # =====================================================
    # SCORES
    # =====================================================

    experience_match = clean_score(
        data.get(
            "experience_match",
            0,
        )
    )

    education_match = clean_score(
        data.get(
            "education_match",
            0,
        )
    )


    # =====================================================
    # CALCULATE OVERALL MATCH SCORE
    # =====================================================

    # Required skills = 65%
    #
    # Preferred skills = 15%
    #
    # Experience = 10%
    #
    # Education = 10%

    if required:

        required_score = (
            len(matched_required)
            / len(required)
        ) * 65

    else:

        required_score = 65


    if preferred:

        preferred_score = (
            len(matched_preferred)
            / len(preferred)
        ) * 15

    else:

        preferred_score = 15


    experience_score = (
        experience_match * 0.10
    )

    education_score = (
        education_match * 0.10
    )


    match_score = round(
        required_score
        + preferred_score
        + experience_score
        + education_score
    )


    match_score = max(
        0,
        min(
            100,
            match_score,
        )
    )


    # =====================================================
    # SUGGESTIONS
    # =====================================================

    suggestions = unique_case_insensitive(
        clean_list(
            data.get(
                "suggestions",
                [],
            )
        )
    )


    # =====================================================
    # RECOMMENDATION
    # =====================================================

    recommendation = str(
        data.get(
            "recommendation",
            "",
        )
        or ""
    ).strip()


    # =====================================================
    # FINAL RESULT
    # =====================================================

    return {

        "match_score":
            match_score,

        "matched_skills":
            matched_required
            + matched_preferred,

        "missing_skills":
            missing_required
            + missing_preferred,

        "required_skills":
            required,

        "preferred_skills":
            preferred,

        "matched_required_skills":
            matched_required,

        "matched_preferred_skills":
            matched_preferred,

        "missing_required_skills":
            missing_required,

        "missing_preferred_skills":
            missing_preferred,

        "experience_match":
            experience_match,

        "education_match":
            education_match,

        "suggestions":
            suggestions,

        "recommendation":
            recommendation,
    }