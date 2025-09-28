import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Loader2, 
  CheckCircle,
  Eye,
  Download,
  Calendar,
  User
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  template: string;
  category: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Patient {
  id: string;
  name: string;
  age?: number;
  gender: string;
  specialty: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
}

interface ReportTemplateSelectionModalProps {
  open: boolean;
  onClose: () => void;
  patient: Patient;
  onTemplateSelected: (template: ReportTemplate, reportData: any) => void;
}

export const ReportTemplateSelectionModal: React.FC<ReportTemplateSelectionModalProps> = ({
  open,
  onClose,
  patient,
  onTemplateSelected
}) => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [reportTitle, setReportTitle] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['/api/report-templates'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/report-templates');
      return await response.json();
    },
    enabled: open
  });

  // Remove the internal mutation - use callback approach instead

  // Filter templates
  const filteredTemplates = templates.filter((template: ReportTemplate) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory && template.isActive;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(templates.map((t: ReportTemplate) => t.category)))];

  // Auto-generate report title
  useEffect(() => {
    if (selectedTemplate && patient) {
      const date = new Date().toLocaleDateString();
      setReportTitle(`${selectedTemplate.name} Report - ${patient.name} - ${date}`);
    }
  }, [selectedTemplate, patient]);

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template);
  };

  const handleGenerateReport = () => {
    if (!selectedTemplate) {
      toast({
        title: "No Template Selected",
        description: "Please select a template to continue",
        variant: "destructive",
      });
      return;
    }

    if (!reportTitle.trim()) {
      toast({
        title: "Report Title Required",
        description: "Please enter a title for the report",
        variant: "destructive",
      });
      return;
    }

    // Use the callback to let parent handle the mutation
    onTemplateSelected(selectedTemplate, {
      title: reportTitle,
      notes: reportNotes
    });
    onClose();
  };

  const renderTemplatePreview = (template: ReportTemplate) => {
    // Show first 200 characters of template
    const preview = template.template.length > 200 
      ? template.template.substring(0, 200) + '...'
      : template.template;
    
    return (
      <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded border">
        <div className="font-medium mb-1">Template Preview:</div>
        <div className="whitespace-pre-wrap">{preview}</div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Generate Report for {patient.name}
          </DialogTitle>
          <DialogDescription>
            Select a template and customize your report details
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
          {/* Templates List */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="flex items-center space-x-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading templates...</span>
                </div>
              ) : filteredTemplates.length > 0 ? (
                <div className="space-y-3">
                  {filteredTemplates.map((template: ReportTemplate) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate?.id === template.id 
                          ? 'ring-2 ring-blue-500 border-blue-200' 
                          : 'border-gray-200'
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {template.category}
                            </Badge>
                            {selectedTemplate?.id === template.id && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {renderTemplatePreview(template)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                  <FileText className="w-8 h-8 mb-2" />
                  <p>No templates found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Report Configuration */}
          <div className="flex flex-col space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium">{patient.name}</span>
                </div>
                <div>Age: {patient.age || 'N/A'}</div>
                <div>Gender: {patient.gender}</div>
                <div>Specialty: {patient.specialty}</div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div>
                <Label htmlFor="reportTitle">Report Title *</Label>
                <Input
                  id="reportTitle"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Enter report title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="reportNotes">Additional Notes</Label>
                <Textarea
                  id="reportNotes"
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Enter any additional notes or observations..."
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            <div className="flex flex-col space-y-2">
              <Button
                onClick={handleGenerateReport}
                disabled={!selectedTemplate || !reportTitle.trim() || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
              
              <Button variant="outline" onClick={onClose} className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportTemplateSelectionModal;