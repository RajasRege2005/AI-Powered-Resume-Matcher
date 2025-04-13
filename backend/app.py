from flask import Flask, request, jsonify
import os
import fitz  # PyMuPDF
import google.generativeai as genai
from dotenv import load_dotenv
from flask_cors import CORS
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("Missing GEMINI_API_KEY environment variable")

genai.configure(api_key=api_key)

app = Flask(__name__)
CORS(app)  

def is_url(text):
    """Check if the provided text is a URL"""
    try:
        result = urlparse(text)
        return all([result.scheme, result.netloc])
    except:
        return False

def scrape_job_description(url):
    """Scrape job description from a URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract text content from the page (remove scripts, styles, etc.)
        for script in soup(['script', 'style', 'header', 'footer', 'nav']):
            script.decompose()
            
        page_text = soup.get_text(separator=' ', strip=True)
        
        # Use Gemini to extract the job description from the page content
        description = extract_job_description_with_gemini(page_text, url)
        return description
    except Exception as e:
        print(f"Error scraping job description: {e}")
        return None

def extract_job_description_with_gemini(page_content, url):
    """Use Gemini to extract the job description from page content"""
    prompt = f"""
You are a job description extraction assistant.

I have a web page from the following URL: {url}

Please extract ONLY the job description from this page content. Include job requirements, responsibilities, qualifications, and skills.
Format this as a clean job description without any HTML or extraneous website content.
Focus only on the actual job description text.

Page content:
{page_content[:10000]}  # Limiting content length
"""
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error extracting job description: {e}")
        return None
        
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
    # Add this at the beginning for debugging:
    print("=== FULL GEMINI RESPONSE ===")
    print(response_text)
    print("===========================")
    
    result = {
        "skills": [],
        "cold_emails": [],
        "reasons": [],
        "improvement_suggestions": []
    }
    
    # Remove match percentage extraction since we're not using it anymore
    
    # Extract skills (unchanged)
    skills_section = re.search(r'key skills:?\s*(.*?)(?:\n\n|\n[A-Z])', response_text, re.IGNORECASE | re.DOTALL)
    if skills_section:
        skills_text = skills_section.group(1)
        if '-' in skills_text:
            skills = [s.strip().strip('- ') for s in skills_text.split('\n') if s.strip()]
        else:
            skills = [s.strip() for s in skills_text.split(',')]
        result["skills"] = [s for s in skills if s]
    
    # Simpler email template extraction - more reliable
    # Extract the entire section between "Cold Email Templates:" and "Improvement Suggestions:"
    email_section = re.search(r'Cold Email Template(s)?:(.*?)(?:Improvement Suggestions:|$)', 
                             response_text, re.IGNORECASE | re.DOTALL)
    
    if email_section:
        email_content = email_section.group(2).strip()
        print("=== EMAIL SECTION FOUND ===")
        print(email_content)
        print("==========================")
        
        # Try a more flexible template detection
        templates_parts = re.split(r'(?i)template\s*\d+\s*:', email_content)
        
        emails = []
        for part in templates_parts[1:]:  # Skip first empty part
            if len(part.strip()) > 20:  # Only include substantial content
                emails.append(part.strip())
                print(f"Added email template: {part.strip()[:50]}...")
        
        if emails:
            result["cold_emails"] = emails
            print(f"Found {len(emails)} email templates")
        else:
            print("No email templates extracted after splitting")
            # ADDED: Fallback - if no templates found but section exists, use the whole content
            if email_content and len(email_content.strip()) > 20:
                result["cold_emails"] = [email_content.strip()]
                print("Using whole email section as fallback")
    
    # Extract reasons
    reasons_section = re.search(r'(good match|bad match|reasons):?\s*(.*?)(?:\n\n|\n[A-Z]|$)', response_text, re.IGNORECASE | re.DOTALL)
    if reasons_section:
        reasons_text = reasons_section.group(2)
        if '-' in reasons_text:
            reasons = [r.strip().strip('- ') for r in reasons_text.split('\n') if r.strip()]
        else:
            reasons = [reasons_text.strip()]
        result["reasons"] = [r for r in reasons if r]
    
    # Extract improvement suggestions
    improvements_section = re.search(r'(improvement suggestions|resume suggestions|suggestions for improvement):?\s*(.*?)(?:\n\n|\n[A-Z]|$)', response_text, re.IGNORECASE | re.DOTALL)
    if improvements_section:
        improvements_text = improvements_section.group(2)
        if '-' in improvements_text:
            improvements = [i.strip().strip('- ') for i in improvements_text.split('\n') if i.strip()]
        else:
            improvements = [improvements_text.strip()]
        result["improvement_suggestions"] = [i for i in improvements if i]
    
    # Add debugging output
    print(f"Found {len(result['cold_emails'])} email templates")
    
    return result

def analyze_resume_with_gemini(resume_text, job_desc):
    prompt = f"""
You are an AI career assistant analyzing a resume against a job description.

CRITICAL FORMATTING REQUIREMENTS:
- Do not use asterisks (*) ANYWHERE in your response
- Use plain text formatting only with hyphens (-) for bullet points
- Generate exactly 1 complete cold email as specified below

First analyze this resume against the job description:

1. Key Skills:
   - List key skills from the resume using hyphens
   - Focus on technical and relevant professional skills

2. Match Analysis:
   
   Reasons:
   - Reason 1 why the candidate might be a good fit for this role
   - Reason 2 why the candidate might be a good fit for this role
   - Any potential gaps or mismatches between the resume and job requirements

3. Cold Email Template:
   
   Template 1:
   Subject: [Write a specific attention-grabbing subject line]
   
   Dear Hiring Manager,
   
   [Write a complete professional email introducing the candidate, highlighting key matching qualifications, and requesting an interview. Use specific details from both the resume and job description. Make this email comprehensive and ready to send without further editing.]
   
   Sincerely,
   [Name from resume]

    Improvement Suggestions:
   - Suggestion 1 to improve resume for this job
   - Suggestion 2 to improve resume for this job
   - Suggestion 3 to improve resume for this job

Resume:
{resume_text}

Job Description:
{job_desc}
"""
    
    # Set temperature to reduce randomness
    model = genai.GenerativeModel(
        'gemini-1.5-flash', 
        generation_config=genai.GenerationConfig(temperature=0.1)
    )
    response = model.generate_content(prompt)
    return response.text

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file provided"}), 400
    
    resume_file = request.files['resume']
    job_url = request.form.get('job_description', '')
    
    if not job_url:
        return jsonify({"error": "No job posting URL provided"}), 400
    
    if resume_file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not resume_file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Only PDF files are supported"}), 400
    
    # Validate URL format
    if not is_url(job_url):
        return jsonify({"error": "Please provide a valid URL"}), 400
    
    try:
        resume_text = extract_text_from_pdf(resume_file)
        if not resume_text:
            return jsonify({"error": "Could not extract text from PDF"}), 400
        
        # Scrape job description from URL (now mandatory)
        scraped_job_desc = scrape_job_description(job_url)
        if not scraped_job_desc:
            return jsonify({"error": "Could not extract job description from the provided URL"}), 400
        
        analysis_text = analyze_resume_with_gemini(resume_text, scraped_job_desc)
        structured_result = parse_gemini_response(analysis_text)
        
        return jsonify(structured_result)
    
    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({"error": "An error occurred while processing your request"}), 500

if __name__ == '__main__':
    app.run(debug=True)
