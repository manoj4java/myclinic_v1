import React, { useRef, useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface TemplateContentEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  height?: string;
}

export const TemplateContentEditor: React.FC<TemplateContentEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Enter template content...',
  className = '',
  height = '400px'
}) => {
  const quillRef = useRef<ReactQuill>(null);
  const [content, setContent] = useState(value);
  const { toast } = useToast();

  // Medical document variables that can be inserted
  const templateVariables = [
    { key: '{{patientName}}', label: 'Patient Name', category: 'Patient Info' },
    { key: '{{patientId}}', label: 'Patient ID', category: 'Patient Info' },
    { key: '{{age}}', label: 'Age', category: 'Patient Info' },
    { key: '{{gender}}', label: 'Gender', category: 'Patient Info' },
    { key: '{{phone}}', label: 'Phone', category: 'Patient Info' },
    { key: '{{address}}', label: 'Address', category: 'Patient Info' },
    { key: '{{email}}', label: 'Email', category: 'Patient Info' },
    { key: '{{studyDate}}', label: 'Study Date', category: 'Study Info' },
    { key: '{{studyTime}}', label: 'Study Time', category: 'Study Info' },
    { key: '{{modality}}', label: 'Modality', category: 'Study Info' },
    { key: '{{accession}}', label: 'Accession Number', category: 'Study Info' },
    { key: '{{center}}', label: 'Medical Center', category: 'Study Info' },
    { key: '{{refBy}}', label: 'Referred By', category: 'Study Info' },
    { key: '{{reportedBy}}', label: 'Reported By', category: 'Study Info' },
    { key: '{{studyDesc}}', label: 'Study Description', category: 'Study Info' },
    { key: '{{chiefComplaint}}', label: 'Chief Complaint', category: 'Medical History' },
    { key: '{{medicalHistory}}', label: 'Medical History', category: 'Medical History' },
    { key: '{{currentDate}}', label: 'Current Date', category: 'System' },
    { key: '{{currentTime}}', label: 'Current Time', category: 'System' },
  ];

  // Quill configuration for medical documents
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': ['Times New Roman', 'Arial', 'Helvetica', 'Georgia', 'Verdana'] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean'],
      // Custom buttons for medical formatting
      ['medical-table', 'patient-info-table']
    ],
    clipboard: {
      matchVisual: false,
    }
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'align',
    'blockquote', 'code-block',
    'link', 'image',
    'table'
  ];

  useEffect(() => {
    setContent(value);
  }, [value]);

  useEffect(() => {
    // Add custom fonts to Quill
    const Font = ReactQuill.Quill.import('formats/font');
    Font.whitelist = ['Times New Roman', 'Arial', 'Helvetica', 'Georgia', 'Verdana'];
    ReactQuill.Quill.register(Font, true);

    // Add custom CSS for medical document styling
    const style = document.createElement('style');
    style.textContent = `
      .ql-editor {
        font-family: 'Times New Roman', serif;
        font-size: 12pt;
        line-height: 1.6;
        color: #000;
      }
      
      .ql-editor h1 {
        font-size: 18pt;
        font-weight: bold;
        text-align: center;
        margin-bottom: 20px;
        color: #2c3e50;
      }
      
      .ql-editor h2 {
        font-size: 14pt;
        font-weight: bold;
        margin-top: 20px;
        margin-bottom: 10px;
      }
      
      .ql-editor .patient-info-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      
      .ql-editor .patient-info-table td {
        border: 1px solid #000;
        padding: 8px 12px;
        vertical-align: top;
      }
      
      .ql-editor .patient-info-table .label {
        font-weight: bold;
        background-color: #f0f0f0;
        width: 30%;
      }
      
      .ql-font-times-new-roman {
        font-family: 'Times New Roman', serif;
      }
      
      .ql-font-arial {
        font-family: Arial, sans-serif;
      }
      
      .ql-font-helvetica {
        font-family: Helvetica, sans-serif;
      }
      
      .ql-font-georgia {
        font-family: Georgia, serif;
      }
      
      .ql-font-verdana {
        font-family: Verdana, sans-serif;
      }
      
      .template-variable {
        background-color: #e3f2fd;
        border: 1px solid #2196f3;
        border-radius: 4px;
        padding: 2px 6px;
        font-family: monospace;
        color: #1976d2;
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleChange = (content: string) => {
    setContent(content);
    onChange?.(content);
  };

  const insertVariable = (variable: string) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      if (range) {
        quill.insertText(range.index, variable);
        quill.setSelection(range.index + variable.length);
      } else {
        quill.insertText(quill.getLength() - 1, variable);
      }
    }
  };

  const insertPatientInfoTable = () => {
    const tableHTML = `
      <table class="patient-info-table">
        <tr>
          <td class="label">Patient ID:</td>
          <td class="value">{{patientId}}</td>
          <td class="label">Patient Name:</td>
          <td class="value">{{patientName}}</td>
        </tr>
        <tr>
          <td class="label">Age/Sex:</td>
          <td class="value">{{age}}/{{gender}}</td>
          <td class="label">Date:</td>
          <td class="value">{{studyDate}}</td>
        </tr>
        <tr>
          <td class="label">Referred By:</td>
          <td class="value">{{refBy}}</td>
          <td class="label">Reported Date:</td>
          <td class="value">{{currentDate}}</td>
        </tr>
      </table>
    `;

    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      if (range) {
        quill.clipboard.dangerouslyPasteHTML(range.index, tableHTML);
      }
    }
  };

  const insertMedicalSectionTemplate = () => {
    const sectionHTML = `
      <h1>MEDICAL REPORT</h1>
      <h2>CLINICAL HISTORY:</h2>
      <p>{{chiefComplaint}}</p>
      <h2>TECHNIQUE:</h2>
      <p>{{studyDesc}}</p>
      <h2>FINDINGS:</h2>
      <p>[Enter findings here]</p>
      <h2>IMPRESSION:</h2>
      <p>[Enter impression here]</p>
      <div style="margin-top: 40px;">
        <p><strong>Reported by:</strong> {{reportedBy}}</p>
        <p><strong>Date:</strong> {{currentDate}}</p>
      </div>
    `;

    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      quill.clipboard.dangerouslyPasteHTML(0, sectionHTML);
    }
  };

  const groupedVariables = templateVariables.reduce((acc, variable) => {
    if (!acc[variable.category]) {
      acc[variable.category] = [];
    }
    acc[variable.category].push(variable);
    return acc;
  }, {} as Record<string, typeof templateVariables>);

  return (
    <Card className={`template-content-editor ${className}`}>
      
      <CardContent className="space-y-4">
      
        {/* Rich Text Editor */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Template Content</Label>
          <div 
            className="border rounded-lg overflow-hidden"
            style={{ height }}
          >
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={handleChange}
              modules={modules}
              formats={formats}
              placeholder={placeholder}
              style={{
                height: `calc(${height} - 42px)`, // Account for toolbar height
                fontFamily: 'Times New Roman, serif'
              }}
            />
          </div>
        </div>

        {/* Preview Info */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Medical Document Tips</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Use <strong>Times New Roman</strong> font for professional medical documents</li>
            <li>• Insert patient info tables for structured data presentation</li>
            <li>• Template variables will be replaced with actual patient data</li>
            <li>• Content will be converted to Word-compatible format for downloads</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateContentEditor;