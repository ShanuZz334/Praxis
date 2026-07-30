import zipfile
import xml.etree.ElementTree as ET
import sys
import io

def read_docx(path):
    try:
        with zipfile.ZipFile(path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.XML(xml_content)
            paragraphs = []
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            for p in tree.findall('.//w:p', ns):
                texts = [node.text for node in p.findall('.//w:t', ns) if node.text]
                if texts:
                    paragraphs.append(''.join(texts))
            return '\n'.join(paragraphs)
    except Exception as e:
        return f"Error reading {path}: {e}"

with open(r"c:\project\ALLBACKUP\Praxis\scratch\doc_output2.txt", "w", encoding="utf-8") as f:
    for arg in sys.argv[1:]:
        f.write(f"\n--- {arg} ---\n")
        f.write(read_docx(arg))
        f.write("\n")
