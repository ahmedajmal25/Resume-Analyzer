from flask import Flask, request, jsonify
from flask_cors import CORS  # type: ignore
import spacy
import openai
import os
from io import BytesIO
from openai import OpenAI
from pdfminer.high_level import extract_text
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)
nlp = spacy.load("en_core_web_sm")

# Load OpenAI API Key from environment variable
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

if not client.api_key:
    print("API key is not set!")
else:
    print("API key loaded successfully!")

# Function to extract text from PDF
def extract_text_from_pdf(pdf_file):
    """ Extracts text from an uploaded PDF file """
    pdf_bytes = pdf_file.read()  # Read file into bytes
    pdf_stream = BytesIO(pdf_bytes)  # Convert to file-like object
    return extract_text(pdf_stream)  # Extract text from PDF

# Function to analyze resume using GPT
# def analyze_resume(resume_text, job_text):
#     if not resume_text or not job_text:
#         return {"match_score": 0, "matched_skills": [], "gpt_analysis": "No data provided"}

#     # Generate a prompt for GPT
#     prompt = f"""
#     You are an expert HR recruiter. Compare the following resume with the job description.
#     Provide key skills match percentage and a short summary of how well the candidate fits.

#     Resume:
#     {resume_text}

#     Job Description:
#     {job_text}

#     Provide response in JSON format:
#     {{
#       "match_score": "percentage match",
#       "matched_skills": ["list of skills"],
#       "gpt_analysis": "summary of candidate fit"
#     }}
#     """

#     try:
#         response = client.chat.completions.create(
#             model="gpt-3.5-turbo",
#             messages=[{"role": "user", "content": prompt}],
#             max_tokens=50  # Increased token limit for better responses
#         )
#         result = response.choices[0].message.content.strip()
#         return eval(result)  # Convert JSON string to dictionary

#     except Exception as e:
#         return {"match_score": 0, "matched_skills": [], "gpt_analysis": f"Error: {str(e)}"}


def analyze_resume(resume_text, job_text):
    if not resume_text or not job_text:
        return {"match_score": 0, "matched_skills": [], "gpt_analysis": "No data provided"}

    job_keywords = set(job_text.lower().split())  # Simple word splitting
    resume_keywords = set(resume_text.lower().split())

    matched_skills = list(job_keywords & resume_keywords)  # Find common words
    match_score = round((len(matched_skills) / len(job_keywords)) * 100) if job_keywords else 0

    return {
        "match_score": match_score,
        "matched_skills": matched_skills,
        "gpt_analysis": "GPT analysis is disabled for now."
    }

@app.route("/")
def home():
    return "Resume Analyzer is running!"

@app.route("/analyze", methods=["POST"])
def analyze():
    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    pdf_file = request.files["resume"]
    job_text = request.form.get("job_description", "")

    if not job_text:
        return jsonify({"error": "Job description is required"}), 400

    resume_text = extract_text_from_pdf(pdf_file)

    # Debugging: Print extracted text
    print("Extracted Resume Text:\n", resume_text)

    if not resume_text.strip():  # If text extraction fails
        return jsonify({"error": "Failed to extract text from resume"}), 400

    result = analyze_resume(resume_text, job_text)

    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)