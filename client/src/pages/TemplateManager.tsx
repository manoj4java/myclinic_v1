import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { withPermissions } from '@/hooks/usePermissions';
import { TemplateContentEditor } from '@/components/TemplateContentEditor';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Search, 
  Filter,
  FileText,
  Save,
  X,
  Download,
  Upload
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  template: string;
  category: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function TemplateManager() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Form states
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Fetch templates
  const { data: templates = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/report-templates'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/report-templates');
      return await response.json();
    }
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: Partial<ReportTemplate>) => {
      const response = await apiRequest('POST', '/api/report-templates', templateData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/report-templates'] });
      resetForm();
      setIsCreating(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive",
      });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...templateData }: Partial<ReportTemplate> & { id: string }) => {
      const response = await apiRequest('PATCH', `/api/report-templates/${id}`, templateData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/report-templates'] });
      resetForm();
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/report-templates/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/report-templates'] });
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
    }
  });

  // Filter templates
  const filteredTemplates = templates.filter((template: ReportTemplate) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(templates.map((t: ReportTemplate) => t.category)))];

  const resetForm = () => {
    setTemplateName('');
    setTemplateDescription('');
    setTemplateCategory('');
    setTemplateContent('');
    setIsActive(true);
    setSelectedTemplate(null);
  };

  const handleEdit = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description || '');
    setTemplateCategory(template.category);
    setTemplateContent(template.template);
    setIsActive(template.isActive);
    setIsEditing(true);
  };

  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!templateName.trim()) {
      toast({
        title: "Validation Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    if (!templateCategory.trim()) {
      toast({
        title: "Validation Error",
        description: "Template category is required",
        variant: "destructive",
      });
      return;
    }

    if (!templateContent.trim()) {
      toast({
        title: "Validation Error",
        description: "Template content is required",
        variant: "destructive",
      });
      return;
    }

    const templateData = {
      name: templateName,
      description: templateDescription,
      template: templateContent,
      category: templateCategory,
      isActive
    };

    if (isEditing && selectedTemplate) {
      updateTemplateMutation.mutate({ ...templateData, id: selectedTemplate.id });
    } else {
      createTemplateMutation.mutate(templateData);
    }
  };

  const handleDelete = (template: ReportTemplate) => {
    if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      deleteTemplateMutation.mutate(template.id);
    }
  };

  const handleDuplicate = (template: ReportTemplate) => {
    setTemplateName(`${template.name} (Copy)`);
    setTemplateDescription(template.description || '');
    setTemplateCategory(template.category);
    setTemplateContent(template.template);
    setIsActive(true);
    setIsCreating(true);
  };

  const exportTemplate = (template: ReportTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_template.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const showEditor = isCreating || isEditing;

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50/50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Template Manager</h1>
              <p className="text-gray-600 mt-1">
                Create and manage medical report templates with rich formatting
              </p>
            </div>
            <Button onClick={handleCreate} className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template List */}
          <div className={`${showEditor ? 'lg:col-span-1' : 'lg:col-span-3'} space-y-4`}>
            {/* Search and Filter */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Templates ({filteredTemplates.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Search and Filter - One Line */}
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="w-48">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category === 'all' ? 'All Categories' : category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template List */}
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {filteredTemplates.map((template: ReportTemplate) => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-sm">{template.name}</h3>
                            <Badge variant={template.isActive ? "default" : "secondary"}>
                              {template.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          {template.description && (
                            <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Badge variant="outline">{template.category}</Badge>
                            {template.createdAt && (
                              <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(template);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(template);
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              exportTemplate(template);
                            }}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(template);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredTemplates.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No templates found</p>
                    <Button 
                      variant="outline" 
                      onClick={handleCreate}
                      className="mt-2"
                    >
                      Create Your First Template
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Editor Panel */}
          {showEditor && (
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      {isEditing ? <Edit className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                      {isEditing ? 'Edit Template' : 'Create New Template'}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setIsCreating(false);
                        resetForm();
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="templateName">Template Name *</Label>
                      <Input
                        id="templateName"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Enter template name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="templateCategory">Category *</Label>
                      <Input
                        id="templateCategory"
                        value={templateCategory}
                        onChange={(e) => setTemplateCategory(e.target.value)}
                        placeholder="e.g., Radiology, Pathology"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="templateDescription">Description</Label>
                    <Textarea
                      id="templateDescription"
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="Brief description of this template"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                    <Label htmlFor="isActive">Active Template</Label>
                  </div>

                  <Separator />

                  {/* Rich Text Editor */}
                  <TemplateContentEditor
                    value={templateContent}
                    onChange={setTemplateContent}
                    placeholder="Design your medical report template with rich formatting..."
                    height="500px"
                  />

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setIsCreating(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                    >
                      {(createTemplateMutation.isPending || updateTemplateMutation.isPending) && (
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      <Save className="w-4 h-4 mr-2" />
                      {isEditing ? 'Update Template' : 'Create Template'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withPermissions(TemplateManager, {
  menu: 'templates',
  module: 'templates',
  action: 'view'
});