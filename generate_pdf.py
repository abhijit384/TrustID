import markdown
from fpdf import FPDF, HTMLMixin
import os

class PDF(FPDF, HTMLMixin):
    def header(self):
        # Logo or Title on every page except cover
        if self.page_no() > 1:
            self.set_font('helvetica', 'B', 10)
            self.set_text_color(2, 132, 199) # Cyan
            self.cell(0, 10, 'TRUST-ID | Smart India Hackathon Proposal', 0, 1, 'R')
            self.line(10, 20, 200, 20)
            self.ln(5)

    def footer(self):
        # Position at 1.5 cm from bottom
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')
        self.cell(0, 10, 'TRUST-ID - AI-Based Fake Identity & Document Screening System', 0, 0, 'R')

def generate_pdf():
    # Read Markdown
    with open("TRUST-ID_Project_Proposal.md", "r", encoding="utf-8") as f:
        md_text = f.read()

    # Convert to HTML
    md_text = md_text.replace("—", "-").replace("–", "-")
    md_text = md_text.replace("“", "\"").replace("”", "\"")
    md_text = md_text.replace("’", "'").replace("‘", "'")
    md_text = md_text.replace("↓", "|")
    html_text = markdown.markdown(md_text, extensions=['tables'])

    # Basic CSS/styling for HTMLMixin
    html_text = f"""
    <font face="helvetica">
    {html_text}
    </font>
    """

    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font("helvetica", size=11)
    
    # Write HTML
    pdf.write_html(html_text)

    pdf.output("TRUST-ID_Project_Proposal.pdf")

if __name__ == "__main__":
    generate_pdf()
