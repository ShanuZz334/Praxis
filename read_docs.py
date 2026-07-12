import docx
import sys

def read_docx(file_path, output_path):
    doc = docx.Document(file_path)
    text = []
    for para in doc.paragraphs:
        text.append(para.text)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(text))

read_docx('C:/project/ALLBACKUP/Praxis/Praxis documents/upstox 1.docx', 'C:/project/ALLBACKUP/Praxis/Praxis documents/upstox_1.md')
read_docx('C:/project/ALLBACKUP/Praxis/Praxis documents/upstox 2.docx', 'C:/project/ALLBACKUP/Praxis/Praxis documents/upstox_2.md')
