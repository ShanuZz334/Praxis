import React, { useMemo, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './RichTextEditor.css';

const Quill = ReactQuill.Quill;
const Embed = Quill.import('blots/embed');

class ImageBlot extends Embed {
  static create(value) {
    const node = super.create();
    node.setAttribute('contenteditable', false);
    
    const img = document.createElement('img');
    img.setAttribute('src', value);
    
    const btn = document.createElement('button');
    btn.innerHTML = '×';
    btn.className = 'custom-image-delete-btn';
    
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const blot = Quill.find(node);
      if (blot) blot.remove();
    });

    node.appendChild(img);
    node.appendChild(btn);
    return node;
  }

  static value(node) {
    const img = node.querySelector('img');
    return img ? img.getAttribute('src') : '';
  }
}

ImageBlot.blotName = 'image';
ImageBlot.tagName = 'span';
ImageBlot.className = 'custom-image-wrapper';

Quill.register(ImageBlot, true);

export default function RichTextEditor({ value, onChange, readOnly, placeholder, className = '' }) {
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  }), []);

  useEffect(() => {
    const tooltips = {
      '.ql-bold': 'Bold',
      '.ql-italic': 'Italic',
      '.ql-underline': 'Underline',
      '.ql-strike': 'Strikethrough',
      '.ql-list[value="ordered"]': 'Numbered List',
      '.ql-list[value="bullet"]': 'Bullet List',
      '.ql-link': 'Insert Link',
      '.ql-image': 'Insert Image',
      '.ql-clean': 'Clear Formatting',
      '.ql-header': 'Heading Level',
      '.ql-color': 'Text Color',
      '.ql-background': 'Background Color',
      '.ql-align': 'Text Alignment'
    };

    // Delay slightly to ensure Quill has rendered the toolbar DOM
    const timer = setTimeout(() => {
      Object.keys(tooltips).forEach((selector) => {
        const elements = document.querySelectorAll(`.rich-text-wrapper ${selector}`);
        elements.forEach((el) => {
          if (el.classList.contains('ql-picker')) {
            const label = el.querySelector('.ql-picker-label');
            if (label) label.setAttribute('title', tooltips[selector]);
          } else {
            el.setAttribute('title', tooltips[selector]);
          }
        });
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`rich-text-wrapper ${readOnly ? 'read-only' : ''} ${className}`}>
      <ReactQuill 
        theme="snow"
        value={value || ''} 
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        modules={modules}
      />
    </div>
  );
}
