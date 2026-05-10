import httpx
from bs4 import BeautifulSoup
import re
from datetime import datetime
from app.database import SessionLocal
from app.models import Job
from app.jobs_common import (
    infer_job_type,
    infer_organization,
    extract_qualification_tags,
    parse_last_date,
    compute_is_open,
)

def fetch_and_store_jobs_once() -> dict:
    """
    Scrape various Tripura job portals and store new jobs as 'pending'.
    Returns a summary dict.
    """
    db = SessionLocal()
    added = 0
    errors = 0
    
    sources = [
        {"url": "https://tpsc.tripura.gov.in/", "name": "TPSC"},
        {"url": "https://jrbtripura.com/", "name": "JRBT"},
        {"url": "https://tripurapolice.gov.in/", "name": "Tripura Police"}
    ]
    
    try:
        with httpx.Client(timeout=15.0, verify=False) as client:
            for source in sources:
                try:
                    resp = client.get(source["url"])
                    resp.raise_for_status()
                    soup = BeautifulSoup(resp.text, 'html.parser')
                    
                    for a in soup.find_all('a', href=True):
                        text = a.get_text(strip=True)
                        if not text or len(text) < 10:
                            continue
                            
                        lower_text = text.lower()
                        
                        exclude_words = ['result', 'admit card', 'syllabus', 'answer key', 'corrigendum', 'postpone', 'cancel', 'interview schedule', 'marks', 'merit list']
                        if any(ex in lower_text for ex in exclude_words):
                            continue
                            
                        if 'recruitment' in lower_text or 'advertisement' in lower_text or 'vacancy' in lower_text:
                            href = a['href']
                            if not href.startswith('http'):
                                if href.startswith('/'):
                                    href = source["url"].rstrip('/') + href
                                else:
                                    href = source["url"].rstrip('/') + '/' + href
                                    
                            title = text[:290]
                            source_link = href
                            
                            exists = db.query(Job).filter(
                                Job.title == title,
                                Job.source_link == source_link
                            ).first()
                            
                            if not exists:
                                org = infer_organization(title, source["name"])
                                job_type = infer_job_type(title)
                                q_tags = extract_qualification_tags(title)
                                last_date = parse_last_date(title)
                                
                                new_job = Job(
                                    title=title,
                                    organization=org,
                                    job_type=job_type,
                                    location="Tripura",
                                    qualification_tags=q_tags,
                                    qualification_text=title,
                                    last_date=last_date,
                                    source_link=source_link[:990],
                                    status="pending",
                                    is_open=compute_is_open(last_date)
                                )
                                db.add(new_job)
                                added += 1
                                
                except Exception as e:
                    print(f"Error fetching from {source['url']}: {e}")
                    errors += 1
                    
        if added > 0:
            db.commit()
    except Exception as e:
        print(f"Global fetcher error: {e}")
    finally:
        db.close()
        
    return {"added": added, "errors": errors}
