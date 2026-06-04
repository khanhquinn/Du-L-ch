from pathlib import Path
import sys

from docx import Document


def main():
    doc = Document(Path(sys.argv[1]))
    prefixes = tuple(sys.argv[2:]) or ("3.3.", "Bảng ")
    for i, paragraph in enumerate(doc.paragraphs):
        text = " ".join(paragraph.text.split())
        if text.startswith(prefixes):
            print(i, text)


if __name__ == "__main__":
    main()
