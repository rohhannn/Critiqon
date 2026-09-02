import json

from openai import OpenAI

from ..config import OPENAI_API_KEY, OPENAI_MODEL


# ============================================================
# OPENAI CLIENT
# ============================================================

def _client() -> OpenAI:

    if not OPENAI_API_KEY:
        raise RuntimeError(
            "OPENAI_API_KEY is not configured on the server."
        )

    return OpenAI(
        api_key=OPENAI_API_KEY,
        timeout=60.0,
        max_retries=2,
    )


# ============================================================
# ATS SCORING
# ============================================================

FINAL_ATS_WEIGHTS = {
    "ats_compatibility": 0.20,
    "contact_information": 0.10,
    "skills_keywords": 0.15,
    "projects_experience": 0.20,
    "education": 0.10,
    "certifications": 0.10,
    "career_relevance": 0.15,
}


def _clean_score(
    value,
    default=0,
):
    """
    Safely convert a score into an integer between 0 and 100.
    """

    try:
        score = float(value)

    except (
        TypeError,
        ValueError,
    ):
        return default

    if score < 0:
        return 0

    if score > 100:
        return 100

    return int(round(score))


def _calculate_ats_score(
    scoring,
):
    """
    Calculate the final ATS score deterministically.

    The AI provides only the individual category scores.
    Python calculates the final score using fixed weights.

    The AI-provided ats_score is intentionally ignored.
    """

    if not isinstance(
        scoring,
        dict,
    ):
        scoring = {}

    normalized_scores = {}

    for category in FINAL_ATS_WEIGHTS:

        normalized_scores[category] = _clean_score(
            scoring.get(
                category,
                0,
            )
        )

    weighted_score = sum(
        normalized_scores[category]
        * weight
        for category, weight
        in FINAL_ATS_WEIGHTS.items()
    )

    final_score = int(
        round(
            weighted_score
        )
    )

    final_score = max(
        0,
        min(
            100,
            final_score,
        ),
    )

    return final_score


# ============================================================
# HELPERS
# ============================================================

def _clean_list(value):
    """
    Convert AI list fields into clean Python lists of strings.
    """

    if value is None:
        return []

    if isinstance(value, str):

        value = value.strip()

        if not value:
            return []

        return [
            item.strip()
            for item in value.split("\n")
            if item.strip()
        ]

    if isinstance(value, (list, tuple)):

        cleaned = []

        for item in value:

            if item is None:
                continue

            text = str(item).strip()

            if text:
                cleaned.append(text)

        return cleaned

    return []


def _parse_json(content):
    """
    Safely parse JSON returned by OpenAI.
    """

    if not content:

        raise ValueError(
            "AI returned an empty response."
        )

    content = content.strip()

    try:

        return json.loads(
            content
        )

    except json.JSONDecodeError as error:

        if "```" in content:

            cleaned = (
                content
                .replace(
                    "```json",
                    "",
                )
                .replace(
                    "```JSON",
                    "",
                )
                .replace(
                    "```",
                    "",
                )
                .strip()
            )

            try:

                return json.loads(
                    cleaned
                )

            except json.JSONDecodeError:
                pass

        raise ValueError(
            f"AI returned invalid JSON: {error}"
        )


# ============================================================
# NORMALIZE ANALYSIS
# ============================================================

def _normalize_analysis(
    result,
):
    """
    Normalize AI output into the exact structure
    expected by the application.

    The final ATS score is calculated by Python from
    deterministic category weights.

    The AI's ats_score is never trusted.
    """

    if not isinstance(
        result,
        dict,
    ):
        raise ValueError(
            "AI resume analysis must return a JSON object."
        )

    def normalize_skills(value):

        raw_skills = _clean_list(
            value
        )

        cleaned = []
        seen = set()

        for skill in raw_skills:

            skill = str(
                skill
            ).strip()

            if not skill:
                continue

            # ------------------------------------------------
            # Separate combined technologies.
            #
            # TensorFlow/PyTorch
            # ->
            # TensorFlow
            # PyTorch
            #
            # HTML/CSS
            # ->
            # HTML
            # CSS
            # ------------------------------------------------

            parts = [
                part.strip()
                for part in skill.split("/")
                if part.strip()
            ]

            for part in parts:

                if not part:
                    continue

                key = part.lower()

                if key in seen:
                    continue

                cleaned.append(
                    part
                )

                seen.add(
                    key
                )

        return cleaned

    # --------------------------------------------------------
    # CATEGORY SCORING
    # --------------------------------------------------------

    scoring = result.get(
        "scoring",
        {},
    )

    if not isinstance(
        scoring,
        dict,
    ):
        scoring = {}

    normalized_scoring = {}

    for category in FINAL_ATS_WEIGHTS:

        normalized_scoring[category] = _clean_score(
            scoring.get(
                category,
                0,
            )
        )

    # --------------------------------------------------------
    # IMPORTANT:
    #
    # Ignore result["ats_score"] completely.
    #
    # The final score comes ONLY from normalized_scoring.
    # --------------------------------------------------------

    final_ats_score = _calculate_ats_score(
        normalized_scoring
    )

    return {

        "ats_score":
            final_ats_score,

        "summary":
            str(
                result.get(
                    "summary"
                )
                or ""
            ).strip(),

        "strengths":
            _clean_list(
                result.get(
                    "strengths"
                )
            ),

        "weaknesses":
            _clean_list(
                result.get(
                    "weaknesses"
                )
            ),

        "skills":
            normalize_skills(
                result.get(
                    "skills"
                )
            ),

        "missing_skills":
            normalize_skills(
                result.get(
                    "missing_skills"
                )
            ),

        "suggestions":
            _clean_list(
                result.get(
                    "suggestions"
                )
            ),

        "recommended_roles":
            _clean_list(
                result.get(
                    "recommended_roles"
                )
            ),
    }


# ============================================================
# RESUME ANALYSIS
# ============================================================

def analyze_resume(
    resume_text: str,
):

    if not resume_text or not resume_text.strip():

        raise ValueError(
            "Resume text is empty."
        )

    # ========================================================
    # ANALYSIS PROMPT
    # ========================================================

    prompt = f"""
You are an expert ATS resume evaluator, senior technical
recruiter, and career coach.

Analyze the COMPLETE resume carefully.

The supplied resume is the ONLY source of truth.

============================================================
CRITICAL SOURCE-OF-TRUTH RULE
============================================================

NEVER invent information.

You MUST inspect the COMPLETE resume before producing
your analysis.

A fact is considered PRESENT if it appears explicitly
ANYWHERE in the resume.

This includes:

- About Me / Summary
- Skills
- Education
- Certifications
- Projects
- Project technology lists
- Project descriptions
- Work experience
- Training
- Any other resume section

The location of the information does NOT matter.

============================================================
SKILLS EXTRACTION RULE
============================================================

The "skills" array must contain ALL technical skills that
are explicitly mentioned ANYWHERE in the resume.

A skill DOES NOT need to appear in the dedicated Skills
section to be considered present.

For example, if the resume contains:

"Technologies: TensorFlow, OpenCV, Keras"

then the following MUST be included in "skills":

TensorFlow
OpenCV
Keras

even if they are not listed in the main Skills section.

If the resume contains:

"Implemented TF-IDF vectorization and cosine similarity
using Scikit-learn"

then these explicitly mentioned technical concepts may
also be included:

TF-IDF
Cosine Similarity
Scikit-learn

Do NOT add technologies merely because they are commonly
associated with another technology.

For example:

Python does NOT automatically mean:

- NumPy
- Pandas
- TensorFlow
- PyTorch

Machine Learning does NOT automatically mean:

- TensorFlow
- PyTorch
- Keras

JavaScript does NOT automatically mean:

- React
- Next.js
- Node.js

Node.js does NOT automatically mean:

- Express.js
- MongoDB
- Redis

Full-stack development does NOT automatically mean:

- REST APIs
- Docker
- AWS
- React

Only include those technologies if they are explicitly
mentioned somewhere in the resume.

============================================================
SKILL DUPLICATION RULE
============================================================

Do not unnecessarily duplicate the same skill.

For example, if the resume mentions:

Python

multiple times, return:

Python

only once.

Use the most recognizable standard name where possible.

============================================================
COMBINED SKILL RULE
============================================================

Do NOT combine separate technologies into one skill.

For example, NEVER return:

"TensorFlow/PyTorch"

when both technologies are explicitly mentioned.

Return:

"TensorFlow"
"PyTorch"

as separate skills.

Likewise, do not combine:

"HTML/CSS"

Return:

"HTML"
"CSS"

Do not use "/" to create a combined skill name.

============================================================
MISSING SKILLS RULE
============================================================

Before identifying missing skills, search the COMPLETE
resume for each candidate skill.

A skill MUST NOT appear in "missing_skills" if it is
explicitly mentioned anywhere in the resume.

For example, if the project section says:

"Technologies: TensorFlow, OpenCV, Keras"

then:

TensorFlow
OpenCV
Keras

are PRESENT.

They MUST NOT be listed as missing skills.

"missing_skills" should contain only skills that:

1. Are genuinely absent from the COMPLETE resume, AND
2. Are relevant to the candidate's demonstrated career
   direction.

Do NOT generate a generic list of popular technologies.

Do NOT automatically list:

- AWS
- Azure
- GCP
- Docker
- Kubernetes
- MongoDB
- Redis
- Jenkins
- React
- PyTorch
- TensorFlow

unless their absence is genuinely relevant to the
candidate's demonstrated career direction.

Only identify missing skills that would realistically
matter for the candidate's likely target roles.

If there are no clearly important missing skills,
return an empty array.

============================================================
NO CONTRADICTIONS
============================================================

The final response MUST be internally consistent.

A technology cannot simultaneously be:

- present in "skills"

AND:

- listed in "missing_skills"

A technology explicitly mentioned in a project cannot
be described as absent.

Do not criticize the candidate for failing to list a
technology in the dedicated Skills section if that
technology is explicitly mentioned elsewhere in the resume.

============================================================
RECOMMENDED ROLES RULE
============================================================

Recommended roles must be based on the actual resume.

Consider:

- education
- projects
- explicitly listed skills
- certifications
- stated interests
- demonstrated technical direction

Do not recommend senior positions.

Do not recommend roles requiring professional experience
that the resume does not demonstrate.

For a student or new graduate, prioritize realistic
entry-level or internship roles.

============================================================
WEAKNESSES RULE
============================================================

Weaknesses must describe actual weaknesses in the supplied
resume.

Do NOT invent missing information.

For example:

If there is no internship or work experience listed,
you may say:

"No professional internship or work experience is listed."

Do NOT say:

"Candidate lacks professional experience."

because the resume only tells you what is listed.

A technology or skill appearing only inside a project,
certification, education section, training section, or
experience section is still PRESENT.

Do not call it missing merely because it is not repeated
in the main Skills section.

Only identify weaknesses supported by the resume.

============================================================
SUGGESTIONS RULE
============================================================

Suggestions must be actionable improvements to the resume.

They may address:

- missing contact information
- weak project descriptions
- lack of measurable results
- unclear formatting
- missing LinkedIn
- missing GitHub
- unclear career direction
- weak bullet points
- lack of relevant professional experience
- unnecessary skills
- inconsistent formatting
- weak keyword targeting

Do NOT tell the candidate to add a technology simply
because it is popular.

Do NOT invent achievements that the candidate should claim.

If recommending measurable results, tell the candidate
to add real metrics only if they genuinely have them.

============================================================
ATS CATEGORY SCORING
============================================================

You MUST evaluate these seven categories:

1. ats_compatibility
2. contact_information
3. skills_keywords
4. projects_experience
5. education
6. certifications
7. career_relevance

Each category MUST be a numeric score from 0 to 100.

Use the following definitions:

ats_compatibility:
Evaluate ATS readability, structure, section clarity,
standard terminology, and machine-readable organization.

contact_information:
Evaluate completeness and professionalism of available
contact information based ONLY on what appears in the resume.

skills_keywords:
Evaluate relevant technical skills and keyword coverage
based on the actual resume.

projects_experience:
Evaluate the quality, relevance, specificity, and evidence
of projects and experience actually listed.

education:
Evaluate relevance, clarity, completeness, and presentation
of the candidate's education.

certifications:
Evaluate the relevance, credibility, clarity, and
presentation of certifications actually listed.

career_relevance:
Evaluate how well the resume supports realistic target
roles based on the candidate's actual education, skills,
projects, certifications, and stated direction.

IMPORTANT:

Do NOT return a final "ats_score".

Python will calculate the final ATS score deterministically
from these seven category scores.

Do NOT attempt to calculate or guess the final weighted
score yourself.

============================================================
ATS SCORE WEIGHTS
============================================================

The application uses these fixed weights:

ats_compatibility = 20%
contact_information = 10%
skills_keywords = 15%
projects_experience = 20%
education = 10%
certifications = 10%
career_relevance = 15%

You only provide the seven category scores.

Python calculates the final score.

============================================================
ATS SCORING GUIDELINES
============================================================

For each category:

90-100 = Excellent
80-89  = Very strong
70-79  = Good
60-69  = Average
50-59  = Weak
40-49  = Poor
1-39   = Very poor
0      = Essentially absent

Do not give arbitrary scores.

Base every category score on evidence in the resume.

Do not punish a student simply because they do not have
professional experience.

============================================================
FORMATTING EXTRACTION RULE
============================================================

PDF extraction can change the visual order of text.

Do NOT assume extracted text order represents the exact
visual layout of the original PDF.

Use headings and surrounding content to identify sections.

For example:

ABOUT ME
EDUCATION AND TRAINING
SKILLS
CERTIFICATIONS
PROJECTS

may appear in an unusual order after PDF extraction.

That alone does NOT prove the original resume has bad
formatting.

Only criticize formatting when there is actual evidence
of a formatting problem.

============================================================
PROJECT TECHNOLOGY RULE
============================================================

Project technology lists are part of the resume.

For example:

Project:
Brain Tumor Detection

Description:
Built a deep learning model using TensorFlow and OpenCV.

Then:

TensorFlow
OpenCV

are PRESENT skills.

Do not say they are missing merely because they are absent
from the main Skills section.

============================================================
RESUME
============================================================

{resume_text}

============================================================
ANALYSIS TASK
============================================================

Analyze:

1. ATS compatibility
2. Resume structure
3. Formatting
4. Technical skills
5. Programming languages
6. Frameworks and libraries
7. Databases
8. Tools
9. Technical concepts
10. Projects
11. Education
12. Certifications
13. Keywords
14. Contact information
15. Professional experience
16. Career readiness
17. Missing relevant skills
18. Suitable entry-level roles
19. Overall resume quality

============================================================
OUTPUT
============================================================

Return ONLY valid JSON.

Return EXACTLY this structure:

{{
    "scoring": {{
        "ats_compatibility": 0,
        "contact_information": 0,
        "skills_keywords": 0,
        "projects_experience": 0,
        "education": 0,
        "certifications": 0,
        "career_relevance": 0
    }},
    "summary": "",
    "strengths": [],
    "weaknesses": [],
    "skills": [],
    "missing_skills": [],
    "suggestions": [],
    "recommended_roles": []
}}

Do not add any other fields.

Do not return "ats_score".

Do not use markdown.

Do not include explanations outside JSON.
"""

    # ========================================================
    # OPENAI REQUEST
    # ========================================================

    response = _client().chat.completions.create(

        model=OPENAI_MODEL,

        messages=[
            {
                "role": "system",
                "content": (
                    "You are a highly accurate ATS resume "
                    "evaluator and senior technical recruiter. "
                    "Use the complete supplied resume as the "
                    "only source of truth. "
                    "Never invent skills, technologies, "
                    "experience, projects, qualifications, "
                    "or achievements. "
                    "Skills mentioned anywhere in the resume, "
                    "including project technology lists, "
                    "are considered present. "
                    "Never combine separate technologies "
                    "with '/'. Return each technology as a "
                    "separate skill. "
                    "Return the seven required scoring "
                    "categories. Do not return ats_score."
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

        temperature=0.1,
    )

    content = (
        response
        .choices[0]
        .message
        .content
    )

    # ========================================================
    # PARSE
    # ========================================================

    result = _parse_json(
        content
    )

    # ========================================================
    # VALIDATE AI SCORING
    # ========================================================

    scoring = result.get(
        "scoring",
        {},
    )

    if not isinstance(
        scoring,
        dict,
    ):
        scoring = {}

    valid_scoring_fields = sum(
        1
        for category in FINAL_ATS_WEIGHTS
        if category in scoring
    )

    # --------------------------------------------------------
    # If the AI failed to provide usable category scoring,
    # retry once.
    #
    # This is NOT based on the final ATS score.
    # A legitimate score of 0 is allowed.
    # --------------------------------------------------------

    if valid_scoring_fields == 0:

        retry_prompt = f"""
Re-evaluate the following complete resume.

The previous response did not provide usable ATS category
scores.

The resume is the ONLY source of truth.

Do not invent information.

Return exactly these seven numeric category scores,
each between 0 and 100:

- ats_compatibility
- contact_information
- skills_keywords
- projects_experience
- education
- certifications
- career_relevance

Do NOT return an ats_score.

The application will calculate the final ATS score itself.

Also return:

- summary
- strengths
- weaknesses
- skills
- missing_skills
- suggestions
- recommended_roles

Skills explicitly mentioned anywhere in the resume count
as present.

Project technology lists count as part of the resume.

Do not infer technologies.

Do not invent experience.

Do not invent achievements.

Separate combined technologies such as:

TensorFlow/PyTorch

into:

TensorFlow
PyTorch

Return ONLY valid JSON.

Resume:

========================================================

{resume_text}

========================================================

Return exactly:

{{
    "scoring": {{
        "ats_compatibility": 0,
        "contact_information": 0,
        "skills_keywords": 0,
        "projects_experience": 0,
        "education": 0,
        "certifications": 0,
        "career_relevance": 0
    }},
    "summary": "",
    "strengths": [],
    "weaknesses": [],
    "skills": [],
    "missing_skills": [],
    "suggestions": [],
    "recommended_roles": []
}}
"""

        retry_response = _client().chat.completions.create(

            model=OPENAI_MODEL,

            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a strict ATS resume evaluator. "
                        "Use only evidence explicitly present "
                        "in the supplied resume. "
                        "Project technology lists are part of "
                        "the resume and count as present skills. "
                        "Never invent skills or experience. "
                        "Never combine separate technologies "
                        "with '/'. "
                        "Return all seven ATS category scores "
                        "between 0 and 100. "
                        "Do not return ats_score."
                    ),
                },
                {
                    "role": "user",
                    "content": retry_prompt,
                },
            ],

            response_format={
                "type": "json_object"
            },

            temperature=0.1,
        )

        retry_content = (
            retry_response
            .choices[0]
            .message
            .content
        )

        result = _parse_json(
            retry_content
        )

    # ========================================================
    # FINAL NORMALIZATION
    # ========================================================

    final_result = _normalize_analysis(
        result
    )

    return final_result


# ============================================================
# COVER LETTER GENERATION
# ============================================================

def generate_cover_letter(
    resume_text: str,
    job_description: str,
):

    if not resume_text or not resume_text.strip():

        raise ValueError(
            "Resume text is empty."
        )

    if (
        not job_description
        or not job_description.strip()
    ):

        raise ValueError(
            "Job description is empty."
        )

    prompt = f"""
You are an expert career coach and professional technical recruiter.

Create a professional, concise, highly tailored cover letter based ONLY
on the candidate's resume and the supplied job description.

===========================================================
SOURCE-OF-TRUTH RULES
===========================================================

1. The candidate's resume is the ONLY source of truth about the candidate.

2. The job description is the ONLY source of truth about the company,
   position, responsibilities, and requirements.

3. Never invent work experience.

4. Never invent companies.

5. Never invent job titles.

6. Never invent achievements or metrics.

7. Never invent qualifications.

8. Never invent technologies, frameworks, tools, or skills.

9. Never claim the candidate has experience with something merely because
   it appears in the job description.

10. Only make claims that are directly supported by the resume.

If the resume only lists a technology or skill, describe it as
"knowledge of", "familiarity with", or "experience with" rather than
claiming professional-level experience.

Never infer frequency, proficiency level, ownership, impact, or
professional experience unless the resume explicitly supports it.

11. Only mention the company or position when it is present in the job
    description.

12. Do not add a date unless one is explicitly provided.

13. Do not use information from outside the supplied resume and
    job description.

===========================================================
TAILORING
===========================================================

- Identify the most important requirements in the job description.

- Match those requirements against actual evidence in the resume.

- Prioritize the 2–3 strongest matches.

- Connect the candidate's specific projects, skills, education,
  certifications, or experience to the relevant requirements.

- Do not simply create a list of skills.

- Do not mention unrelated projects just to make the letter longer.

- If the job description requests a technology that is NOT present
  in the resume, do not claim the candidate knows that technology.

- If the candidate has a genuinely related skill, explain the
  connection accurately without exaggerating.

===========================================================
STRUCTURE
===========================================================

Paragraph 1:
- State the exact position and company if available.
- Briefly introduce the candidate using information from the resume.
- Explain the candidate's relevance to the position.

Paragraph 2:
- Connect specific requirements from the job description with actual
  skills or experience in the resume.
- Give concrete examples from the resume.

Paragraph 3:
- Highlight one or two particularly relevant projects or experiences.
- Explain why they demonstrate suitability for this specific role.

Paragraph 4:
- Give a short, professional closing.
- Express interest in the opportunity.
- Avoid generic filler.

===========================================================
STYLE
===========================================================

- Professional and natural.
- Suitable for student, internship, entry-level, and new-graduate
  applications.
- Approximately 250–350 words.
- Clear and concise.
- No exaggerated claims.
- No unnecessary repetition.
- No emojis.
- No markdown.
- No bullet points.
- No headings such as "Cover Letter".
- Avoid generic AI-sounding language.
- Do not simply rewrite the job description.
- Make the letter sound like a real candidate wrote it.

===========================================================
FINAL VALIDATION
===========================================================

Before returning the cover letter, verify:

- Every candidate-specific claim appears in the resume.
- Every company-specific claim comes from the job description.
- The position matches the supplied job description.
- No technologies were invented.
- No experience was invented.
- No achievements were invented.
- No dates were invented.
- No unrelated information was added.
- The result is approximately 250–350 words.
- The result contains only the final cover letter.

===========================================================
CANDIDATE RESUME
===========================================================

{resume_text}

===========================================================
JOB DESCRIPTION
===========================================================

{job_description}

===========================================================

Write the final cover letter now.
"""

    # ========================================================
    # OPENAI REQUEST
    # ========================================================

    response = _client().chat.completions.create(

        model=OPENAI_MODEL,

        messages=[
            {
                "role": "system",
                "content": (
                    "You are a senior recruiter and "
                    "professional technical cover "
                    "letter writer. "
                    "Be accurate, evidence-based, "
                    "concise, natural, and strictly "
                    "follow the supplied resume and "
                    "job description."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],

        temperature=0.4,
    )

    content = (
        response
        .choices[0]
        .message
        .content
    )

    if not content:

        raise ValueError(
            "AI returned an empty cover letter."
        )

    return content.strip()