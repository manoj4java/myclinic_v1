import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, X, Download, FileText, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WordDocumentViewerProps {
  fileUrl: string;
  fileName?: string;
  onClose?: () => void;
  className?: string;
  height?: string;
}

export const WordDocumentViewer: React.FC<WordDocumentViewerProps> = ({
  fileUrl,
  fileName = 'Document',
  onClose,
  className = '',
  height = '600px'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadDocument = async () => {
      if (!containerRef.current || !fileUrl) return;

      setIsLoading(true);
      setError(null);

      try {
        // Clear previous content
        containerRef.current.innerHTML = '';

        // Fetch the document
        const response = await fetch(fileUrl, {
          credentials: 'include',
          headers: {
            'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,*/*'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load document: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();

        // Check if the response is actually a Word document
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') && !contentType.includes('application/octet-stream')) {
          throw new Error('Invalid file format. Expected a Word document (.docx)');
        }

        // Render the document
        await renderAsync(arrayBuffer, containerRef.current, undefined, {
          className: 'docx-preview-container',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: false,
          useMathMLPolyfill: true,
          showChanges: false,
          debug: false
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading Word document:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
        setIsLoading(false);
        
        toast({
          title: "Document Load Error",
          description: err instanceof Error ? err.message : 'Failed to load the Word document',
          variant: "destructive",
        });
      }
    };

    loadDocument();
  }, [fileUrl, toast]);

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.endsWith('.docx') ? fileName : `${fileName}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Document downloaded successfully",
      });
    } catch (err) {
      toast({
        title: "Download Error",
        description: "Failed to download the document",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={`word-document-viewer ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center text-lg font-semibold">
          <FileText className="w-5 h-5 mr-2 text-blue-600" />
          {fileName}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center"
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex items-center"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          className="relative border-t"
          style={{ height }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-600">Loading document...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="flex flex-col items-center space-y-4 p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-red-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Document</h3>
                  <p className="text-sm text-gray-600 max-w-md">{error}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="flex items-center"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download Instead
                </Button>
              </div>
            </div>
          )}
          
          <div 
            ref={containerRef}
            className="w-full h-full overflow-auto p-4 bg-white"
            style={{
              minHeight: height,
              fontSize: '14px',
              lineHeight: '1.6'
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default WordDocumentViewer;