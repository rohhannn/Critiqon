import json

from openai import OpenAI

from ..config import (
    OPENAI_API_KEY,
    OPENAI_MODEL,
)


# =========================================================
# OPENAI CLIENT
# =========================================================

def _client() -> OpenAI:
    """
    Create the OpenAI client.

    The timeout is intentionally higher than the frontend
    timeout because interview generation can involve:
    - large resumes
    - long prompts
    - 20 questions
    - structured JSON output
    """

    if not OPENAI_API_KEY:
        raise RuntimeError(
            "OPENAI_API_KEY is not configured on the server."
        )

    return OpenAI(
        api_key=OPENAI_API_KEY,

        # Allow enough time for larger interview generations.
        timeout=120.0,

        # Retry temporary OpenAI/network failures.
        max_retries=2,
    )


# =========================================================
# GENERATE INTERVIEW QUESTIONS
# =========================================================

def generate_interview_questions(
    resume_text: str,
    job_description: str,
    difficulty: str,
    question_count: int,
):
    """
    Generate resume-specific interview questions.

    Designed to support up to 20 questions without making
    the prompt unnecessarily verbose.
    """

    # -----------------------------------------------------
    # NORMALIZE INPUT
    # -----------------------------------------------------

    resume_text = (
        resume_text or ""
    ).strip()

    job_description = (
        job_description or ""
    ).strip()

    if not job_description:
        job_description = (
            "No specific job description was provided."
        )

    if not resume_text:
        raise ValueError(
            "Resume text is empty."
        )

    # -----------------------------------------------------
    # SAFETY LIMIT
    # -----------------------------------------------------

    question_count = max(
        5,
        min(
            int(question_count),
            20,
        ),
    )

    # -----------------------------------------------------
    # PROMPT
    # -----------------------------------------------------

    prompt = f"""
You are an expert technical interviewer and senior recruiter.

Create a realistic interview preparation set based primarily on the
candidate's actual resume.

The questions must NOT be generic questions unrelated to the resume.

Use:
1. The candidate's projects
2. Technologies and skills explicitly mentioned
3. Education
4. Certifications
5. Experience, if present
6. Claims that an interviewer could reasonably ask the candidate to explain
7. The supplied job description, if available

Difficulty:
{difficulty}

Number of questions:
{question_count}

Resume:
------------------------
{resume_text}
------------------------

Job Description:
------------------------
{job_description}
------------------------

Generate exactly {question_count} interview questions.

Create a balanced interview set.

Possible categories:
- Technical
- Resume Based
- Project
- Behavioral
- HR
- Conceptual

Important rules:

- Questions must be answerable by a real candidate.
- Prefer questions directly connected to the resume.
- For project questions, ask about architecture, implementation,
  decisions, challenges, results, tradeoffs, testing, or deployment
  where applicable.
- Do not invent experience that is not present in the resume.
- If the job description mentions a technology not present in the resume,
  questions may test whether the candidate understands it, but clearly
  indicate why it is relevant.
- Include a short explanation of why an interviewer may ask each question.
- Include concise key points the candidate should cover.
- Difficulty must be exactly one of:
  Easy, Medium, Hard.
- Do not include markdown.
- Do not include commentary outside the JSON.
- Return ONLY valid JSON.
- Return exactly {question_count} objects inside the questions array.

Return exactly this structure:

{{
    "questions": [
        {{
            "question": "",
            "category": "",
            "difficulty": "",
            "why_asked": "",
            "key_points": []
        }}
    ]
}}
"""

    # -----------------------------------------------------
    # OPENAI REQUEST
    # -----------------------------------------------------

    client = _client()

    response = client.chat.completions.create(
        model=OPENAI_MODEL,

        messages=[
            {
                "role": "system",
                "content": (
                    "You are a senior technical interviewer "
                    "who specializes in software engineering, "
                    "AI, data science and graduate job interviews. "
                    "You produce concise, accurate, resume-specific "
                    "interview questions in valid JSON."
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

        temperature=0.4,
    )

    # -----------------------------------------------------
    # READ RESPONSE
    # -----------------------------------------------------

    if not response.choices:
        raise ValueError(
            "AI returned no choices."
        )

    content = (
        response.choices[0]
        .message
        .content
    )

    if not content:
        raise ValueError(
            "AI returned an empty response."
        )

    # -----------------------------------------------------
    # PARSE JSON
    # -----------------------------------------------------

    try:
        result = json.loads(content)

    except json.JSONDecodeError as error:
        raise ValueError(
            "AI returned invalid JSON."
        ) from error

    # -----------------------------------------------------
    # VALIDATE RESULT
    # -----------------------------------------------------

    if not isinstance(result, dict):
        raise ValueError(
            "AI returned an invalid response format."
        )

    questions = result.get(
        "questions"
    )

    if not isinstance(questions, list):
        raise ValueError(
            "AI returned an invalid questions format."
        )

    if not questions:
        raise ValueError(
            "AI returned no interview questions."
        )

    # -----------------------------------------------------
    # NORMALIZE QUESTIONS
    # -----------------------------------------------------

    normalized_questions = []

    for item in questions:

        if not isinstance(item, dict):
            continue

        question = item.get(
            "question",
            "",
        )

        if not isinstance(
            question,
            str,
        ):
            continue

        question = question.strip()

        if not question:
            continue

        category = item.get(
            "category",
            "General",
        )

        if not isinstance(
            category,
            str,
        ):
            category = "General"

        difficulty_value = item.get(
            "difficulty",
            difficulty,
        )

        if not isinstance(
            difficulty_value,
            str,
        ):
            difficulty_value = difficulty

        if difficulty_value not in [
            "Easy",
            "Medium",
            "Hard",
        ]:
            difficulty_value = (
                "Medium"
                if difficulty == "Mixed"
                else difficulty
            )

        why_asked = item.get(
            "why_asked",
            "",
        )

        if not isinstance(
            why_asked,
            str,
        ):
            why_asked = ""

        key_points = item.get(
            "key_points",
            [],
        )

        if not isinstance(
            key_points,
            list,
        ):
            key_points = []

        key_points = [
            str(point).strip()
            for point in key_points
            if str(point).strip()
        ]

        normalized_questions.append(
            {
                "question": question,
                "category": category.strip()
                or "General",

                "difficulty": (
                    difficulty_value.strip()
                    or "Medium"
                ),

                "why_asked": (
                    why_asked.strip()
                ),

                "key_points": key_points,
            }
        )

    # -----------------------------------------------------
    # REMOVE DUPLICATES
    # -----------------------------------------------------

    unique_questions = []

    seen = set()

    for item in normalized_questions:

        question_key = (
            item["question"]
            .strip()
            .lower()
        )

        if question_key in seen:
            continue

        seen.add(question_key)

        unique_questions.append(
            item
        )

    normalized_questions = (
        unique_questions
    )

    # -----------------------------------------------------
    # RETURN RESULT
    # -----------------------------------------------------

    return {
        "questions": normalized_questions
    }


# =========================================================
# EVALUATE INTERVIEW ANSWER
# =========================================================

def evaluate_interview_answer(
    question: str,
    answer: str,
    resume_text: str,
    job_description: str,
):
    """
    Evaluate one candidate interview answer.
    """

    question = (
        question or ""
    ).strip()

    answer = (
        answer or ""
    ).strip()

    resume_text = (
        resume_text or ""
    ).strip()

    job_description = (
        job_description or ""
    ).strip()

    prompt = f"""
You are a senior technical interviewer and career coach.

Evaluate the candidate's interview answer carefully.

Question:
------------------------
{question}
------------------------

Candidate Answer:
------------------------
{answer}
------------------------

Candidate Resume:
------------------------
{resume_text}
------------------------

Job Description:
------------------------
{job_description}
------------------------

Evaluate the answer based on:

1. Technical correctness
2. Relevance to the question
3. Completeness
4. Clarity
5. Communication
6. Use of concrete examples
7. Alignment with the candidate's actual resume

IMPORTANT RULES:

- Do not invent experience for the candidate.
- Do not penalize the candidate for not having experience
  that is not required by the question.
- If the answer is technically incorrect, explain why.
- If the answer is incomplete, identify what is missing.
- Keep feedback practical and interview-focused.
- The improved answer must remain truthful to the resume.
- Do not invent projects, companies, achievements, or experience.
- Return ONLY valid JSON.
- Do not return markdown.
- Keep the response concise enough for fast processing.

Return exactly this structure:

{{
    "score": 0,
    "technical_score": 0,
    "communication_score": 0,
    "relevance_score": 0,
    "strengths": [],
    "improvements": [],
    "missing_points": [],
    "feedback": "",
    "improved_answer": ""
}}

Score everything from 0 to 100.
"""

    # -----------------------------------------------------
    # OPENAI REQUEST
    # -----------------------------------------------------

    client = _client()

    response = client.chat.completions.create(
        model=OPENAI_MODEL,

        messages=[
            {
                "role": "system",
                "content": (
                    "You are a senior software engineering "
                    "interviewer and professional career coach. "
                    "Return accurate, concise and practical "
                    "interview feedback in valid JSON."
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

        temperature=0.3,
    )

    # -----------------------------------------------------
    # READ RESPONSE
    # -----------------------------------------------------

    if not response.choices:
        raise ValueError(
            "AI returned no evaluation choices."
        )

    content = (
        response.choices[0]
        .message
        .content
    )

    if not content:
        raise ValueError(
            "AI returned an empty evaluation."
        )

    # -----------------------------------------------------
    # PARSE JSON
    # -----------------------------------------------------

    try:
        result = json.loads(content)

    except json.JSONDecodeError as error:
        raise ValueError(
            "AI returned invalid evaluation JSON."
        ) from error

    if not isinstance(
        result,
        dict,
    ):
        raise ValueError(
            "AI returned an invalid evaluation format."
        )

    return result