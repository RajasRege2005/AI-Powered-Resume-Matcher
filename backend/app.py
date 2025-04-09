from flask import Flask, request, jsonify
import os
import fitz  # PyMuPDF
import google.generativeai as genai
from dotenv import load_dotenv
from flask_cors import CORS
import re

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("Missing GEMINI_API_KEY environment variable")

genai.configure(api_key=api_key)

app = Flask(__name__)
CORS(app)  

def extract_text_from_pdf(file):
    try:
        doc = fitz.open(stream=file.read(), filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""

def parse_gemini_response(response_text):
    """Parse the Gemini response into structured data"""
    result = {
        "match_percentage": 0,
        "skills": [],
        "suggested_jobs": [],
        "reasons": []
    }
    
    # Extract match percentage
    match = re.search(r'(match(?:ing)?\s*(?:score|percentage)[^\d]{0,5})(\d+)', response_text, re.IGNORECASE)
    if match:
        result["match_percentage"] = int(match.group(2))

    
    skills_section = re.search(r'key skills:?\s*(.*?)(?:\n\n|\n[A-Z])', response_text, re.IGNORECASE | re.DOTALL)
    if skills_section:
        skills_text = skills_section.group(1)
        if '-' in skills_text:
            skills = [s.strip().strip('- ') for s in skills_text.split('\n') if s.strip()]
        else:
            skills = [s.strip() for s in skills_text.split(',')]
        result["skills"] = [s for s in skills if s]
    
    jobs_section = re.search(r'suitable job roles:?\s*(.*?)(?:\n\n|\n[A-Z]|$)', response_text, re.IGNORECASE | re.DOTALL)
    if jobs_section:
        jobs_text = jobs_section.group(1)
        if '-' in jobs_text:
            jobs = [j.strip().strip('- ') for j in jobs_text.split('\n') if j.strip()]
        else:
            jobs = [j.strip() for j in jobs_text.split(',')]
        result["suggested_jobs"] = [j for j in jobs if j]
    
    reasons_section = re.search(r'(good match|bad match|reasons):?\s*(.*?)(?:\n\n|\n[A-Z]|$)', response_text, re.IGNORECASE | re.DOTALL)
    if reasons_section:
        reasons_text = reasons_section.group(2)
        if '-' in reasons_text:
            reasons = [r.strip().strip('- ') for r in reasons_text.split('\n') if r.strip()]
        else:
            reasons = [reasons_text.strip()]
        result["reasons"] = [r for r in reasons if r]
    
    return result

def analyze_resume_with_gemini(resume_text, job_desc):
    prompt = f"""
You are an AI career assistant analyzing a resume against a job description.

1. Extract from the following resume:
   - Key Skills (list as bullet points)
   - Technologies
   - Experience (years if available)
   - Suitable job roles (list 2-3 roles)

2. Compare it with this job description:
   - Give a match score (0-100%)
   - List 2–3 specific reasons why it's a good or bad match

Format your response with clear headings for each section.

Resume:
{resume_text}

Job Description:
{job_desc}
"""

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error with Gemini API: {e}")
        return "Error analyzing resume. Please try again."

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file provided"}), 400
    
    resume_file = request.files['resume']
    job_desc = request.form.get('job_description', '')
    
    if not job_desc:
        return jsonify({"error": "No job description provided"}), 400
    
    if resume_file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not resume_file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Only PDF files are supported"}), 400
    
    try:
        resume_text = extract_text_from_pdf(resume_file)
        if not resume_text:
            return jsonify({"error": "Could not extract text from PDF"}), 400
        
        analysis_text = analyze_resume_with_gemini(resume_text, job_desc)
        structured_result = parse_gemini_response(analysis_text)
        
        structured_result["raw_analysis"] = analysis_text
        
        return jsonify(structured_result)
    
    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({"error": "An error occurred while processing your request"}), 500

if __name__ == '__main__':
    app.run(debug=True)
