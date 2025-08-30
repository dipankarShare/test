#!/usr/bin/env python3
"""
Extract raw text from Chase credit card PDF to analyze structure
"""

import PyPDF2
import pdfplumber

def extract_pdf_text(pdf_path):
    """Extract text from PDF using multiple methods"""
    
    print(f"Extracting text from: {pdf_path}")
    print("=" * 50)
    
    # Method 1: PyPDF2
    print("\n--- PyPDF2 Text ---")
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for i, page in enumerate(pdf_reader.pages):
                print(f"\nPage {i+1}:")
                text = page.extract_text()
                print(text[:1000])  # First 1000 chars
                if len(text) > 1000:
                    print("... (truncated)")
    except Exception as e:
        print(f"PyPDF2 error: {e}")
    
    # Method 2: pdfplumber
    print("\n--- pdfplumber Text ---")
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                print(f"\nPage {i+1}:")
                text = page.extract_text()
                print(text[:1000])  # First 1000 chars
                if len(text) > 1000:
                    print("... (truncated)")
    except Exception as e:
        print(f"pdfplumber error: {e}")

if __name__ == "__main__":
    pdf_path = r"D:\Personal\Finance\BankStatements\chase\ChaseCreditCard2025Aug.pdf"
    extract_pdf_text(pdf_path)
