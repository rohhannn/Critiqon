import json

from openai import OpenAI

from ..config import OPENAI_API_KEY, OPENAI_MODEL


def _client() -> OpenAI:
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not configured on the server.")
    return OpenAI(api_key=OPENAI_API_KEY, timeout=60.0, max_retries=2)


def generate_interview_questions(
    resume_text: str,
    job_description: str,
    difficulty: str,
    question_count: int,
):
    job_description = job_description.strip()

    if not job_description:
        job_description = "No specific job description was provided."

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

Generate a balanced interview set.

Possible categories:
- Technical
- Resume Based
- Project
- Behavioral
- HR
- Conceptual

Important:
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
- Include key points the candidate should cover when answering.
- Difficulty must be one of: Easy, Medium, Hard.
- Return ONLY valid JSON.

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

    response = _client().chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a senior technical interviewer who specializes "
                    "in software engineering, AI, data science and graduate "
                    "job interviews."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        response_format={"type": "json_object"},
        temperature=0.4,
    )

    content = response.choices[0].message.content

    if not content:
        raise ValueError("AI returned an empty response.")

    return json.loads(content)
def evaluate_interview_answer(
    question: str,
    answer: str,
    resume_text: str,
    job_description: str,
):
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


    response = _client().chat.completions.create(
        model=OPENAI_MODEL,

        messages=[
            {
                "role": "system",
                "content": (
                    "You are a senior software engineering "
                    "interviewer and professional career coach."
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

    content = response.choices[0].message.content

    if not content:
        raise ValueError(
            "AI returned an empty evaluation."
        )

    return json.loads(content)