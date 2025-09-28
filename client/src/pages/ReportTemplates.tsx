import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Trash2, Edit, Plus, FileText, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  template: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

type FormData = {
  name: string;
  description: string;
  template: string;
  category: string;
  isActive: boolean;
};

const initialFormData: FormData = {
  name: "",
  description: "",
  template: "",
  category: "general",
  isActive: true,
};

const categories = [
  { value: "general", label: "General" },
  { value: "radiology", label: "Radiology" },
  { value: "cardiology", label: "Cardiology" },
  { value: "neurology", label: "Neurology" },
  { value: "orthopedics", label: "Orthopedics" },
  { value: "gastroenterology", label: "Gastroenterology" },
  { value: "pulmonology", label: "Pulmonology" },
  { value: "oncology", label: "Oncology" },
  { value: "pathology", label: "Pathology" },
  { value: "laboratory", label: "Laboratory" },
];

export default function ReportTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch report templates
  const { data: templates = [], isLoading, error } = useQuery<ReportTemplate[]>({
    queryKey: ["/api/report-templates"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/report-templates");
      const data = await response.json();
      console.log("Report templates data:", data);
      return Array.isArray(data) ? data : [];
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: Omit<FormData, 'isActive'> & { isActive: boolean }) => {
      console.log("Creating template with data:", data);
      const response = await apiRequest("POST", "/api/report-templates", data);
      const result = await response.json();
      console.log("Template creation response:", result);
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/report-templates"] });
      await queryClient.refetchQueries({ queryKey: ["/api/report-templates"] });
      console.log("Template created and cache invalidated");
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Report template created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create report template.",
        variant: "destructive",
      });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormData> }) => {
      const response = await apiRequest("PUT", `/api/report-templates/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/report-templates"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Report template updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update report template.",
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/report-templates/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/report-templates"] });
      toast({
        title: "Success",
        description: "Report template deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete report template.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingTemplate(null);
  };

  const handleOpenDialog = (template?: ReportTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || "",
        template: template.template,
        category: template.category || "general",
        isActive: template.isActive,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form submitted with data:", formData);
    console.log("Form validation - name:", formData.name.trim(), "template:", formData.template.trim());
    
    if (!formData.name.trim() || !formData.template.trim()) {
      console.log("Validation failed");
      toast({
        title: "Validation Error",
        description: "Template name and content are required.",
        variant: "destructive",
      });
      return;
    }

    console.log("Validation passed, submitting...");
    if (editingTemplate) {
      console.log("Updating existing template");
      updateTemplateMutation.mutate({
        id: editingTemplate.id,
        data: formData,
      });
    } else {
      console.log("Creating new template");
      createTemplateMutation.mutate(formData);
    }
  };

  const handleDelete = (template: ReportTemplate) => {
    if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      deleteTemplateMutation.mutate(template.id);
    }
  };

  const filteredTemplates = Array.isArray(templates) ? templates.filter(template => 
    selectedCategory === "all" || template.category === selectedCategory
  ) : [];

  console.log("Templates data:", templates);
  console.log("Filtered templates:", filteredTemplates);
  console.log("Selected category:", selectedCategory);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Templates</h3>
          <p className="text-muted-foreground mb-4">
            Unable to load report templates. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Report Templates</h1>
          <p className="text-muted-foreground">
            Manage report templates for standardized medical reports
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Report Template' : 'Create Report Template'}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate 
                  ? 'Update the report template details below.' 
                  : 'Create a new report template for standardized medical reports.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., MRI Brain Report"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of this template"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template">Template Content</Label>
                <Textarea
                  id="template"
                  placeholder="Enter the template content with placeholders (e.g., {{patient_name}}, {{date}}, {{findings}})"
                  value={formData.template}
                  onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value }))}
                  rows={8}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use double curly braces for placeholders: {'{{'} patient_name {'}'}, {'{{'} date {'}'}, {'{{'} findings {'}'}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <Label htmlFor="isActive">Active Template</Label>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                  onClick={() => console.log("Submit button clicked")}
                >
                  {createTemplateMutation.isPending || updateTemplateMutation.isPending 
                    ? "Saving..." 
                    : editingTemplate ? "Update" : "Create"
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Label htmlFor="category-filter">Filter by Category:</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Debug Info */}
      <div className="mb-4 p-4 bg-muted rounded-lg">
        <p><strong>Debug Info:</strong></p>
        <p>Total templates: {templates?.length || 0}</p>
        <p>Filtered templates: {filteredTemplates?.length || 0}</p>
        <p>Selected category: {selectedCategory}</p>
        <p>Is loading: {isLoading ? 'true' : 'false'}</p>
        <p>Error: {error ? 'Yes' : 'No'}</p>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(template)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {template.description && (
                <CardDescription>{template.description}</CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={template.category === 'general' ? 'secondary' : 'outline'}>
                  {categories.find(c => c.value === template.category)?.label || template.category}
                </Badge>
                <Badge variant={template.isActive ? 'default' : 'secondary'}>
                  {template.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>Created: {new Date(template.createdAt).toLocaleDateString()}</p>
                <p>Updated: {new Date(template.updatedAt).toLocaleDateString()}</p>
              </div>
              
              <div className="max-h-20 overflow-hidden">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {template.template.substring(0, 100)}...
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Templates Found</h3>
          <p className="text-muted-foreground mb-4">
            {selectedCategory === "all" 
              ? "Create your first report template to get started." 
              : `No templates found in ${categories.find(c => c.value === selectedCategory)?.label} category.`
            }
          </p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </div>
      )}
    </div>
  );
}