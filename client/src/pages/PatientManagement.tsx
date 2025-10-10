import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueries } from "@tanstack/react-query";
import { SEO } from "@/components/SEO";
import { SEOManager } from "@/components/SEOManager";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions, PermissionGate } from "@/hooks/usePermissions";
import { Card, CardContent } from "@/components/ui/card";
import { exportToExcel } from "@/lib/exportUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useLocation } from "wouter";
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Download,
  Search,
  Filter,
  RefreshCw,
  MonitorPlay,
  History,
  FileUp,
  Paperclip,
  MessageSquare,
  AlertTriangle,
  Clock,
  Info,
  X,
  FileCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest as apiReq, queryClient } from "@/lib/queryClient";
import { EditPatientModal } from "@/components/EditPatientModal";
import AttachReportModal from "@/components/AttachReportModal";
import StudyInfoDialog from "@/components/StudyInfoDialog";
import { CommentsDialog } from "@/components/CommentsDialog";
import { DICOMViewer } from "@/components/DICOMViewer";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReportTemplateSelectionModal } from "@/components/ReportTemplateSelectionModal";
import { WordDocumentViewer } from "@/components/WordDocumentViewer";

export default function PatientManagement() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { canPerformAction } = usePermissions();

  const { data: seoConfig } = useQuery({
    queryKey: ["/api/seo-config/patient-management"],
  });

  const handleSaveSEO = async (config: any) => {
    await apiReq('PUT', '/api/seo-config/patient-management', config);
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedModality, setSelectedModality] = useState("all");
  const [selectedReportStatus, setSelectedReportStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null); // Single patient selection for toolbar
  const [showDICOMViewer, setShowDICOMViewer] = useState(false);
  const [selectedPatientForDICOM, setSelectedPatientForDICOM] = useState<any>(null);
  const [showAttachReportModal, setShowAttachReportModal] = useState(false);
  const [showStudyInfoDialog, setShowStudyInfoDialog] = useState(false);
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showViewReportDialog, setShowViewReportDialog] = useState(false);
  const [showReportTemplateModal, setShowReportTemplateModal] = useState(false);
  const [showWordDocumentViewer, setShowWordDocumentViewer] = useState(false);
  const [selectedReportFile, setSelectedReportFile] = useState<{url: string, name: string} | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const { toast } = useToast();

  // Keyboard navigation for selected patient
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedPatient) return;
      
      if (event.key === 'Escape') {
        setSelectedPatient(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedPatient]);

  // Delete patient mutation
  const deletePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      await apiReq("DELETE", `/api/patients/${patientId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Success",
        description: "Patient deactivated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate patient",
        variant: "destructive",
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (patientIds: string[]) => {
      await Promise.all(
        patientIds.map(id => apiReq("DELETE", `/api/patients/${id}`, {}))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Success",
        description: `${selectedPatients.length} patients deactivated successfully`,
      });
      setSelectedPatients([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate patients",
        variant: "destructive",
      });
    },
  });

  // Report Template Selection Mutation
  const generateReportMutation = useMutation({
    mutationFn: async ({ template, reportData, patient }: { template: any; reportData: any; patient: any }) => {
      const payload = {
        templateId: template.id,
        patientId: patient.id,
        reportTitle: reportData.title,
        reportNotes: reportData.notes,
        templateData: {
          patientName: patient.name,
          patientAge: patient.age?.toString() || 'N/A',
          patientGender: patient.gender,
          patientPhone: patient.phone || 'N/A',
          patientEmail: patient.email || 'N/A',
          reportDate: new Date().toLocaleDateString(),
          reportTime: new Date().toLocaleTimeString(),
          specialty: patient.specialty,
          doctorName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Doctor',
          reportTitle: reportData.title,
          reportNotes: reportData.notes
        }
      };
      
      console.log('Report generation payload:', payload);
      console.log('Template ID:', template.id, 'Patient ID:', patient.id, 'Report Title:', reportData.title);
      
      const response = await apiReq('POST', '/api/reports/generate', payload);
      return await response.json();
    },
    onSuccess: async (data, variables) => {
      console.log('Report generation successful:', data);
      
      // Refresh patient data to update reportStatus
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      if (variables.patient?.id) {
        console.log('Invalidating reports query for patient:', variables.patient.id);
        queryClient.invalidateQueries({ queryKey: ["/api/patients", variables.patient.id, "reports"] });
        
        // Force refetch the reports
        setTimeout(async () => {
          await refetchReports();
        }, 100);
      }
      toast({
        title: "Report Generated Successfully",
        description: "The report has been created and is now available in View Reports",
      });
      setShowReportTemplateModal(false);
      
      // Auto-open the View Report dialog to show the newly created report
      setTimeout(() => {
        setShowViewReportDialog(true);
      }, 1000); // Increased delay to allow for data refresh
    },
    onError: (error) => {
      console.error('Report generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate the report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const attachReportMutation = useMutation({
    mutationFn: async ({ patientId, file }: { patientId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'report');
      
      const response = await fetch(`/api/patients/${patientId}/files`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to attach report');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Success",
        description: "Report attached successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to attach report",
        variant: "destructive",
      });
    },
  });

  const attachDocumentMutation = useMutation({
    mutationFn: async ({ patientId, file }: { patientId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'document');
      
      const response = await fetch(`/api/patients/${patientId}/files`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to attach document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Success",
        description: "Document attached successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to attach document",
        variant: "destructive",
      });
    },
  });

  // Helper function to download reports with proper format conversion
  const downloadReport = async (report: any) => {
    try {
      console.log('Starting download for report:', report);
      
      const token = localStorage.getItem("jwtToken");
      const downloadUrl = report.fileUrl || `/api/files/${report.filePath}`;
      
      console.log('Download URL:', downloadUrl);
      
      const response = await fetch(downloadUrl, {
        credentials: 'include',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Failed to download report: ${response.status} ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      let blob;
      let fileName = report.fileName || report.reportName || 'report';
      
      // Ensure filename has proper extension
      if (!fileName.match(/\.(docx?|html?)$/i)) {
        fileName += '.docx';
      }
      
      console.log('Content type:', contentType);
      console.log('Original filename:', fileName);
      
      // If it's HTML content, convert it to a Word-compatible format
      if (contentType && contentType.includes('text/html')) {
        console.log('Processing HTML content');
        
        const htmlContent = await response.text();
        
        // Create a Word-compatible HTML document
        const completeHtmlDoc = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Medical Report System">
<title>${fileName}</title>
<style>
@page {
  size: 8.5in 11in;
  margin: 1in 1.25in 1in 1.25in;
}
body {
  font-family: 'Times New Roman', serif;
  font-size: 12pt;
  line-height: 1.15;
  margin: 0;
  background: white;
}
.header { text-align: center; margin-bottom: 30px; }
.patient-info-header { margin-bottom: 30px; border: 2px solid #000; }
.patient-info { margin-bottom: 20px; }
.content { margin-bottom: 20px; }
.signature { margin-top: 40px; }
h1 { color: #2c3e50; font-size: 18pt; font-weight: bold; }
h2 { font-size: 14pt; font-weight: bold; }
.info-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}
.info-table td {
  padding: 8px;
  border: 1px solid #ddd;
  vertical-align: top;
}
.info-table td:first-child {
  font-weight: bold;
  background-color: #f8f9fa;
  width: 25%;
}
.patient-info-header { 
  margin-bottom: 15px; 
}
.patient-header-table { 
  width: 100%; 
  border-collapse: collapse; 
  font-size: 12pt; 
  margin-bottom: 0;
}
.patient-header-table td { 
  padding: 4px 8px; 
  border: 1px solid #000; 
  vertical-align: top; 
}
.patient-header-table .label { 
  font-weight: bold; 
  background-color: #f0f0f0; 
  width: 30%; 
}
.patient-header-table .value { 
  background-color: white; 
}
</style>
</head>
<body>
${htmlContent.replace(/<html[^>]*>|<\/html>|<head[^>]*>[\s\S]*?<\/head>|<body[^>]*>|<\/body>|<!DOCTYPE[^>]*>/gi, '')}
</body>
</html>`;
        
        // Create blob with Word MIME type
        blob = new Blob([completeHtmlDoc], { 
          type: 'application/msword'
        });
        
        // Use .doc extension for better compatibility
        fileName = fileName.replace(/\.(docx?|html?)$/i, '') + '.doc';
      } else {
        // For non-HTML content, use the blob as-is
        blob = await response.blob();
      }
      
      console.log('Final filename:', fileName);
      console.log('Blob size:', blob.size);
      
      // Download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('Download completed successfully');
      
      toast({
        title: "Success",
        description: "Report downloaded successfully",
      });
      
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Download Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const toggleEmergencyMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const response = await apiReq("PATCH", `/api/patients/${patientId}/emergency`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Success",
        description: "Emergency status updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update emergency status",
        variant: "destructive",
      });
    },
  });

  const { data: patientsResponse, isLoading, refetch: refetchPatients } = useQuery({
    queryKey: ["/api/patients", { 
      page: currentPage, 
      limit: itemsPerPage, 
      search: (searchQuery && searchQuery.length >= 3) ? searchQuery : undefined,
      specialty: selectedSpecialty !== "all" ? selectedSpecialty : undefined 
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (searchQuery && searchQuery.length >= 3) params.append('search', searchQuery);
      if (selectedSpecialty !== "all") params.append('specialty', selectedSpecialty);
      
      const response = await apiReq("GET", `/api/patients?${params.toString()}`);
      return await response.json();
    },
  });

  const patients = patientsResponse?.data || [];
  const pagination = patientsResponse?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };

  // Fetch file counts for each patient using useQueries to avoid hooks violation
  const fileQueries = useQueries({
    queries: Array.isArray(patients) ? patients.map((patient: any) => ({
      queryKey: ["/api/patients", patient.id, "files"],
      enabled: !!patient.id,
    })) : []
  });

  const patientsWithFiles = Array.isArray(patients) ? patients.map((patient: any, index: number) => {
    const files = fileQueries[index]?.data || [];
    return { 
      ...patient, 
      files: Array.isArray(files) ? files : [],
      fileCount: Array.isArray(files) ? files.length : 0
    };
  }) : [];

  // Fetch patient reports for selected patient
  const { data: patientReports = [], refetch: refetchReports, isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/patients", selectedPatient?.id, "reports"],
    queryFn: async () => {
      if (!selectedPatient?.id) return [];
      
      console.log('Fetching reports for patient:', selectedPatient.id);
      try {
        const response = await apiReq("GET", `/api/patients/${selectedPatient.id}/reports`);
        const data = await response.json();
        console.log('Patient reports response:', data);
        
        // Ensure we return an array
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching patient reports:', error);
        return [];
      }
    },
    enabled: !!selectedPatient?.id,
    staleTime: 0 // Always refetch
  });

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedPatients([]); // Clear selections when changing pages
    setSelectedPatient(null); // Clear selected patient
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setSelectedPatients([]); // Clear selections
    setSelectedPatient(null); // Clear selected patient
  };

  // Reset page when filters change
  const handleSearchChange = (newSearchQuery: string) => {
    setSearchQuery(newSearchQuery);
    // Only trigger search/filter when 3 or more characters are entered, or when clearing
    if (newSearchQuery.length >= 3 || newSearchQuery.length === 0) {
      setCurrentPage(1);
      setSelectedPatients([]);
      setSelectedPatient(null); // Clear selected patient
    }
  };

  const handleSpecialtyChange = (newSpecialty: string) => {
    setSelectedSpecialty(newSpecialty);
    setCurrentPage(1);
    setSelectedPatients([]);
    setSelectedPatient(null); // Clear selected patient
  };

  const handleExport = () => {
    if (!filteredPatients?.length) return;
    
    // Prepare data for export
    const exportData = filteredPatients.map((patient: any) => ({
      'Patient ID': patient.id,
      'Name': patient.name,
      'Email': patient.email,
      'Phone': patient.phone,
      'Emergency': patient.emergency ? 'Yes' : 'No',
      'Report Status': patient.reportStatus || 'N/A',
      'Age': getAge(patient.dateOfBirth),
      'Gender': patient.gender,
      'Study Date': new Date(patient.createdAt).toLocaleDateString(),
      'Study Time': patient.studyTime || 'Not set',
      'Accession': patient.accession || 'Not assigned',
      'Study Description': patient.studyDesc || 'Not specified',
      'Modality': patient.modality || 'Not specified',
      'Files Count': patient.fileCount || 0,
      'Center': patient.center || 'Not specified',
      'Referred By': patient.refBy || 'Not specified',
      'Is Printed': patient.isPrinted ? 'Yes' : 'No',
      'Reported By': patient.reportedBy || 'Not reported'
    }));

    exportToExcel({
      data: exportData,
      filename: `patients-list-page${currentPage}-${new Date().toISOString().split('T')[0]}`,
      sheetName: `Patients Page ${currentPage}`,
      dateFields: ['Study Date']
    });
  };

  // DICOM file detection and handling functions
  const isDICOMFile = (fileName: string) => {
    const dicomExtensions = ['.dcm', '.dicom', '.dic'];
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    const isDicomByExtension = dicomExtensions.includes(extension);
    const isDicomByName = fileName.toLowerCase().includes('dicom');
    // Also check for common DICOM file patterns (e.g., MRBRAIN files)
    const isDicomByPattern = /\.(dcm|dicom|dic)$/i.test(fileName) || 
                            /^(MR|CT|US|XR|RF|DX|CR|SC)[A-Z0-9_]+/i.test(fileName);
    return isDicomByExtension || isDicomByName || isDicomByPattern;
  };

  const getFileUrl = (file: any) => {
    if (!file.filePath) {
      return '';
    }
    
    // If filePath is already a full URL, use it as is
    if (file.filePath.startsWith('http')) {
      return file.filePath;
    }
    
    // If filePath starts with /api/, use it as is (for backward compatibility)
    if (file.filePath.startsWith('/api/')) {
      return `${window.location.origin}${file.filePath}`;
    }
    
    // For new storage system, construct the URL
    return `${window.location.origin}/api/files/${file.filePath}`;
  };

  const getDICOMFilesForPatient = (patient: any) => {
    if (!patient.files || !Array.isArray(patient.files)) return [];
    
    return patient.files
      .filter((file: any) => isDICOMFile(file.fileName))
      .map((file: any) => getFileUrl(file));
  };

  const openDICOMViewer = (patient: any) => {
    const dicomFiles = getDICOMFilesForPatient(patient);
    
    if (dicomFiles.length === 0) {
      toast({
        title: "No DICOM Files",
        description: "This patient has no DICOM files to view.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedPatientForDICOM(patient);
    setShowDICOMViewer(true);
  };

  const closeDICOMViewer = () => {
    setShowDICOMViewer(false);
    setSelectedPatientForDICOM(null);
  };

  const filteredPatients = patientsWithFiles?.filter((patient: any) => {
    // Search filter - only apply if 3 or more characters
    if (searchQuery && searchQuery.length >= 3) {
      const searchLower = searchQuery.toLowerCase();
      const matchesName = patient.name?.toLowerCase().includes(searchLower);
      const matchesPhone = patient.phone?.toLowerCase().includes(searchLower);
      const matchesEmail = patient.email?.toLowerCase().includes(searchLower);
      const matchesId = patient.id?.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesPhone && !matchesEmail && !matchesId) return false;
    }
    
    // Specialty filter
    if (selectedSpecialty && selectedSpecialty !== "all") {
      if (patient.specialty !== selectedSpecialty) return false;
    }
    
    // Status filter
    if (selectedStatus && selectedStatus !== "all") {
      const isActive = selectedStatus === "active";
      if (patient.isActive !== isActive) return false;
    }

    // Modality filter
    if (selectedModality && selectedModality !== "all") {
      if (patient.modality !== selectedModality) return false;
    }

    // Report Status filter
    if (selectedReportStatus && selectedReportStatus !== "all") {
      const patientReportStatus = patient.reportStatus || 'N/A';
      if (patientReportStatus !== selectedReportStatus) return false;
    }
    
    // Date filter
    if (selectedDate) {
      const patientDate = new Date(patient.createdAt).toDateString();
      const filterDate = new Date(selectedDate).toDateString();
      if (patientDate !== filterDate) return false;
    }
    
    return true;
  });

  const getAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const getStatusBadge = (patient: any) => {
    if (!patient.isActive) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-600">Inactive</Badge>;
    }
    if (patient.fileCount > 0) {
      return <Badge className="bg-green-100 text-green-700">Reported</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-700">Active</Badge>;
  };

  const getSpecialtyColor = (specialty: string) => {
    const colors = {
      radiology: "bg-blue-50 text-blue-700 border-blue-200",
      pediatric: "bg-green-50 text-green-700 border-green-200", 
      gynac: "bg-pink-50 text-pink-700 border-pink-200",
      medicines: "bg-purple-50 text-purple-700 border-purple-200",
      surgeon: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[specialty as keyof typeof colors] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPatients(filteredPatients?.map((p: any) => p.id) || []);
    } else {
      setSelectedPatients([]);
    }
  };

  const handleSelectPatient = (patientId: string, checked: boolean) => {
    if (checked) {
      setSelectedPatients(prev => [...prev, patientId]);
    } else {
      setSelectedPatients(prev => prev.filter(id => id !== patientId));
    }
  };

  const handleDeletePatient = (patientId: string, patientName: string) => {
    if (window.confirm(`Are you sure you want to deactivate ${patientName}? This patient will be marked as inactive but data will be preserved.`)) {
      deletePatientMutation.mutate(patientId);
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to deactivate ${selectedPatients.length} patient(s)? They will be marked as inactive but data will be preserved.`)) {
      bulkDeleteMutation.mutate(selectedPatients);
    }
  };

  // Helper function to convert gender to single letter
  const getGenderAbbreviation = (gender: string) => {
    if (!gender) return '-';
    const lowerGender = gender.toLowerCase();
    if (lowerGender === 'male' || lowerGender === 'm') return 'M';
    if (lowerGender === 'female' || lowerGender === 'f') return 'F';
    return gender.charAt(0).toUpperCase(); // Return first letter capitalized for other cases
  };

  // Patient Actions Toolbar Component
  const PatientActionsToolbar = () => {
    if (!selectedPatient) return null;

    const handleFileUpload = (type: 'report' | 'document') => {
      if (type === 'report') {
        setShowAttachReportModal(true);
      } else {
        // Navigate to Attach Document page
        setLocation(`/patients/${selectedPatient.id}/attach-document`);
      }
    };

    const handleComments = () => {
      // Open comments dialog
      setShowCommentsDialog(true);
    };

    const handleTimeline = () => {
      // Navigate to timeline view
      setLocation(`/patients/${selectedPatient.id}/timeline`);
    };

    const handleStudyInfo = () => {
      // Open study info dialog
      setShowStudyInfoDialog(true);
    };

    const handleViewReport = () => {
      // Open view reports dialog
      setShowViewReportDialog(true);
    };

    const handleCreateReport = () => {
      // Open template selection modal for creating new report
      setShowReportTemplateModal(true);
    };

    const hasReports = patientReports && patientReports.length > 0;
    const reportStatus = selectedPatient?.reportStatus || 'N/A';
    
    // Show Report button for new patients (reportStatus = "N/A")
    // Show both "View Report" and "Report" buttons for patients with reports (reportStatus = "Reporting" or other statuses)

    return (
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-2 rounded-lg mb-2 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold">Patient Actions</h3>
            <div className="text-xs opacity-90">
              <span className="font-medium">{selectedPatient.name}</span>
              <span className="mx-1">•</span>
              <span>ID: {selectedPatient.id.slice(0, 8)}</span>
              <span className="mx-1">•</span>
              <span>{selectedPatient.modality || 'N/A'}</span>
              <span className="mx-1">•</span>
              <span>{new Date(selectedPatient.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPatient(null)}
            className="text-white hover:bg-white/20 h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleFileUpload('report')}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-7 px-2 text-xs"
                  disabled={attachReportMutation.isPending}
                >
                  <Paperclip className="w-3 h-3 mr-1" />
                  Attach Report
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload and attach a report file</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleFileUpload('document')}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-7 px-2 text-xs"
                  disabled={attachDocumentMutation.isPending}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Attach Document
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload and attach supporting documents</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleComments}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-7 px-2 text-xs"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Comments
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View and add comments for this patient</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toggleEmergencyMutation.mutate(selectedPatient.id)}
                  className={`border-white/20 h-7 px-2 text-xs ${
                    selectedPatient.emergency
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  disabled={toggleEmergencyMutation.isPending}
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Emergency
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{selectedPatient.emergency ? 'Remove emergency flag' : 'Mark as emergency'}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTimeline}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-7 px-2 text-xs"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Timeline
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View patient timeline and history</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleStudyInfo}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-7 px-2 text-xs"
                >
                  <Info className="w-3 h-3 mr-1" />
                  Study Info
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View detailed study information</p>
              </TooltipContent>
            </Tooltip>

            {/* Report Management Buttons - Dynamic based on reportStatus */}
            {reportStatus === 'N/A' ? (
              // Show only "Report" button for new patients
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCreateReport}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-7 px-2 text-xs"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Report
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create new report for this patient</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              // Show both "View Report" and "Report" buttons for patients with reports
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleViewReport}
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-7 px-2 text-xs"
                    >
                      <FileCheck className="w-3 h-3 mr-1" />
                      View Report
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View existing reports for this patient</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCreateReport}
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-7 px-2 text-xs"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Report
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create new report for this patient</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}

            <PermissionGate module="patients" action="delete">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDeletePatient(selectedPatient.id, selectedPatient.name)}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-7 px-2 text-xs"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Deactivate
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Deactivate patient</p>
                </TooltipContent>
              </Tooltip>
            </PermissionGate>
          </TooltipProvider>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-lg text-muted-foreground">Loading patient data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50/50 to-white min-h-screen" data-testid="patients-view">
      <SEO
        title={(seoConfig as any)?.title || 'Patient Management - ClinicConnect'}
        description={(seoConfig as any)?.description || 'Manage and view patient records, medical studies, and clinical data'}
        path="/patient-management"
        {...(seoConfig || {})}
      />

      {/* Header Section */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Patient Worklist</h1>
            </div>
            <div className="text-xs text-gray-600">
              Medical Records & Study Management System
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>Total: {pagination.total || 0} patients</span>
              </span>
              <span className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>Today: {new Date().toLocaleDateString()}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => refetchPatients()}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PermissionGate module="patients" action="export">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExport}
                      className="h-8 px-2"
                      data-testid="button-export-patients"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export to Excel</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </PermissionGate>
            <PermissionGate module="patients" action="add">
              <Button 
                onClick={() => setLocation("/add-patient")}
                size="sm"
                className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-xs"
                data-testid="button-add-patient"
              >
                <Plus className="w-3 h-3 mr-1" />
                <span>New Patient</span>
              </Button>
            </PermissionGate>
          </div>
        </div>
      </div>

      {/* Advanced Filter Section */}
      <Card className="mb-4 border-blue-100 shadow-sm">
        <CardContent className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-8 gap-3">
            <div className="relative col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
              <Input
                type="text"
                placeholder="Search by name, ID, phone... (min 3 chars)"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-8 text-sm w-full"
                data-testid="input-search-patients"
              />
            </div>
            
            <Select value={selectedSpecialty} onValueChange={handleSpecialtyChange}>
              <SelectTrigger data-testid="select-specialty" className="h-8 text-sm">
                <SelectValue placeholder="All Specialties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                <SelectItem value="radiology">Radiology</SelectItem>
                <SelectItem value="pediatric">Pediatric</SelectItem>
                <SelectItem value="gynac">Gynecology</SelectItem>
                <SelectItem value="medicines">General Medicine</SelectItem>
                <SelectItem value="surgeon">Surgery</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger data-testid="select-status" className="h-8 text-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedModality} onValueChange={setSelectedModality}>
              <SelectTrigger data-testid="select-modality" className="h-8 text-sm">
                <SelectValue placeholder="All Modalities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modalities</SelectItem>
                <SelectItem value="CT">CT Scan</SelectItem>
                <SelectItem value="MRI">MRI</SelectItem>
                <SelectItem value="X-RAY">X-Ray</SelectItem>
                <SelectItem value="ULTRASOUND">Ultrasound</SelectItem>
                <SelectItem value="MAMMOGRAPHY">Mammography</SelectItem>
                <SelectItem value="NUCLEAR">Nuclear Medicine</SelectItem>
                <SelectItem value="PET">PET Scan</SelectItem>
                <SelectItem value="FLUOROSCOPY">Fluoroscopy</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedReportStatus} onValueChange={setSelectedReportStatus}>
              <SelectTrigger data-testid="select-report-status" className="h-8 text-sm">
                <SelectValue placeholder="All Report Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Report Status</SelectItem>
                <SelectItem value="N/A">N/A</SelectItem>
                <SelectItem value="Reporting">Reporting</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Reviewed">Reviewed</SelectItem>
                <SelectItem value="Finalized">Finalized</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-8 text-sm"
              data-testid="input-filter-date"
            />

            <Button 
              variant="outline" 
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => {
                handleSearchChange("");
                handleSpecialtyChange("all");
                setSelectedStatus("all");
                setSelectedModality("all");
                setSelectedReportStatus("all");
                setSelectedDate("");
                setSelectedPatient(null);
              }}
            >
              <Filter className="w-3 h-3 mr-1" />
              <span>Clear</span>
            </Button>

            {selectedPatients.length > 0 && (
              <PermissionGate module="patients" action="delete">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  data-testid="button-bulk-delete"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  <span>
                  {bulkDeleteMutation.isPending ? 'Deactivating...' : `Delete (${selectedPatients.length})`}
                </span>
              </Button>
              </PermissionGate>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient Actions Toolbar */}
      <PatientActionsToolbar />

      {/* Medical Worklist Table */}
      <Card className="shadow-md border-blue-100">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2 rounded-t-lg">
          <h2 className="text-sm font-semibold flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Patient Study Worklist</span>
          </h2>
        </div>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-blue-50">
                <TableRow className="border-blue-100 h-10">
                  <TableHead className="w-10 py-2">
                    <Checkbox
                      checked={selectedPatients.length === filteredPatients?.length && filteredPatients.length > 0}
                      onCheckedChange={handleSelectAll}
                      data-testid="checkbox-select-all"
                      className="w-4 h-4"
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-blue-900 text-xs py-2">Action</TableHead>
                  <TableHead className="font-semibold text-blue-900 text-xs py-2">Emergency</TableHead>
                  <TableHead className="font-semibold text-blue-900 text-xs py-2">Report Status</TableHead>
                  <TableHead className="font-semibold text-blue-900 text-xs py-2">Patient Id</TableHead>
                  <TableHead className="font-semibold text-blue-900 text-xs py-2">Patient Name</TableHead>
                  <TableHead className="font-semibold text-blue-900 text-xs py-2">Age</TableHead>
                  <TableHead className="font-semibold text-blue-900 text-xs py-2">Sex</TableHead>
                  <TableHead className="font-semibold text-blue-900 text-xs py-2">Study Date</TableHead>
                  <TableHead className="font-semibold text-blue-900 text-xs py-2">Study Time</TableHead>
                  <TableHead className="font-semibold text-blue-900 text-xs py-2">Ref by</TableHead>
                  <TableHead className="font-semibold text-blue-900 text-xs py-2">Accession</TableHead>
                  <TableHead className="font-semibold text-blue-900 text-xs py-2">Study Desc</TableHead>
                  <TableHead className="font-semibold text-blue-900 text-xs py-2">Modality</TableHead>
                  <TableHead className="font-semibold text-blue-900 text-xs py-2">Images</TableHead>
                  <TableHead className="font-semibold text-blue-900 text-xs py-2">Center</TableHead>
                  <TableHead className="font-semibold text-blue-900 text-xs py-2">Is Printed</TableHead>
                  <TableHead className="font-semibold text-blue-900 text-xs py-2">Reported by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients?.length > 0 ? (
                  filteredPatients.map((patient: any, index: number) => (
                    <TableRow 
                      key={patient.id} 
                      className={`
                        hover:bg-blue-50/50 transition-colors cursor-pointer h-10
                        ${selectedPatients.includes(patient.id) ? 'bg-blue-50' : ''}
                        ${selectedPatient?.id === patient.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}
                        ${index % 2 === 0 ? 'bg-gray-50/30' : ''}
                      `}
                      onClick={() => setSelectedPatient(patient)}
                      data-testid={`patient-row-${patient.id}`}
                    >
                      <TableCell className="py-1">
                        <Checkbox
                          checked={selectedPatients.includes(patient.id)}
                          onCheckedChange={(checked) => handleSelectPatient(patient.id, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`checkbox-patient-${patient.id}`}
                          className="w-4 h-4"
                        />
                      </TableCell>
                      
                      <TableCell className="px-1 py-1">
                        <div className="flex items-center space-x-0.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/patients/${patient.id}`);
                            }}
                            data-testid={`button-view-${patient.id}`}
                            title="View Patient Details"
                            className="h-6 w-6 p-0"
                          >
                            <Eye className="w-3 h-3 text-blue-600" />
                          </Button>
                          
                          {/* Patient History Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              // For now, navigate to patient details. Can be modified to open history modal later
                              setLocation(`/patients/${patient.id}/history`);
                            }}
                            data-testid={`button-history-${patient.id}`}
                            title="View Patient History"
                            className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <History className="w-3 h-3" />
                          </Button>
                          
                          {/* DICOM Viewer Button - only show if patient has DICOM files */}
                          {getDICOMFilesForPatient(patient).length > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDICOMViewer(patient);
                              }}
                              data-testid={`button-dicom-${patient.id}`}
                              title={`View DICOM Files (${getDICOMFilesForPatient(patient).length})`}
                              className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            >
                              <MonitorPlay className="w-3 h-3" />
                            </Button>
                          )}
                          
                        </div>
                      </TableCell>

                      <TableCell className="py-1">
                        {patient.emergency ? (
                          <Badge className="bg-red-500 text-white border-red-600 text-xs px-1 py-0">
                            Emergency
                          </Badge>
                        ) : (
                          <span className="text-gray-500 text-xs">Normal</span>
                        )}
                      </TableCell>

                      <TableCell className="py-1">
                        <Badge 
                          className={`${
                            patient.reportStatus === 'N/A' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                            patient.reportStatus === 'Reporting' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            patient.reportStatus === 'Draft' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            patient.reportStatus === 'Completed' ? 'bg-green-100 text-green-800 border-green-200' :
                            patient.reportStatus === 'Reviewed' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                            patient.reportStatus === 'Finalized' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          } text-xs px-2 py-1`}
                        >
                          {patient.reportStatus || 'N/A'}
                        </Badge>
                      </TableCell>

                     

                      <TableCell className="font-mono text-xs text-blue-600 py-1">
                        {patient.id.slice(-8).toUpperCase()}
                      </TableCell>

                      <TableCell className="py-1">
                        <div className="font-semibold text-gray-900 text-sm" data-testid={`text-patient-name-${patient.id}`}>
                          {patient.name}
                        </div>
                      </TableCell>

                      <TableCell className="py-1">
                        <div className="text-xs font-medium">{getAge(patient.dateOfBirth)}Y</div>
                      </TableCell>

                      <TableCell className="py-1">
                        <div className="text-xs text-gray-600 font-medium">{getGenderAbbreviation(patient.gender)}</div>
                      </TableCell>

                      <TableCell className="py-1">
                        <div className="text-xs">
                          <div className="font-medium">{new Date(patient.createdAt).toLocaleDateString()}</div>
                        </div>
                      </TableCell>

                      <TableCell className="py-1">
                        <div className="text-xs text-gray-600">
                          {patient.studyTime ? new Date(`2000-01-01T${patient.studyTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : 'Not set'}
                        </div>
                      </TableCell>

                      <TableCell className="py-1">
                        <div className="text-xs text-gray-600">
                          {patient.refBy || 'Not specified'}
                        </div>
                      </TableCell>

                      <TableCell className="py-1">
                        <div className="text-xs font-mono text-gray-600">
                          {patient.accession || 'Not assigned'}
                        </div>
                      </TableCell>

                      <TableCell className="py-1">
                        <div className="text-xs text-gray-600 max-w-32 truncate">
                          {patient.studyDesc || 'Not specified'}
                        </div>
                      </TableCell>

                      <TableCell className="py-1">
                        <div className="text-xs text-gray-600">
                          {patient.modality || 'Not specified'}
                        </div>
                      </TableCell>

                      <TableCell className="py-1">
                        <div className="text-xs font-medium text-blue-600">
                          {patient.fileCount || 0}
                        </div>
                      </TableCell>

                      <TableCell className="py-1">
                        <div className="text-xs text-gray-600">
                          {patient.center || 'Not specified'}
                        </div>
                      </TableCell>

                      <TableCell className="py-1">
                        {patient.isPrinted ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-1 py-0">
                            Printed
                          </Badge>
                        ) : (
                          <span className="text-gray-500 text-xs">Not printed</span>
                        )}
                      </TableCell>

                      <TableCell className="py-1">
                        <div className="text-xs text-gray-600">
                          {patient.reportedBy ? 'Dr. Reported' : 'Not reported'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={19} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2 text-gray-500">
                        <FileText className="w-8 h-8" />
                        <div className="text-base font-medium">No patients found</div>
                        <div className="text-xs">Try adjusting your search filters or add a new patient</div>
                        <Button 
                          onClick={() => setLocation("/add-patient")}
                          className="mt-4"
                          data-testid="button-add-first-patient"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Patient
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <DataTablePagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </CardContent>
      </Card>

      {/* DICOM Viewer Modal */}
      {showDICOMViewer && selectedPatientForDICOM && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-black w-full h-full relative flex flex-col">
            {/* Compact Close Button - Top Right */}
            <Button
              variant="ghost"
              size="sm"
              onClick={closeDICOMViewer}
              data-testid="button-close-dicom-viewer"
              className="absolute top-2 right-2 z-50 bg-black/50 hover:bg-black/70 text-white border-gray-600 h-8 w-8 p-0 rounded-full"
            >
              ✕
            </Button>
            
            <div className="flex-1 overflow-hidden">
              <DICOMViewer
                imageUrls={getDICOMFilesForPatient(selectedPatientForDICOM)}
                isDICOM={true}
                onClose={closeDICOMViewer}
                patientInfo={{
                  name: selectedPatientForDICOM.name || 'Unknown Patient',
                  id: selectedPatientForDICOM.id || '',
                  age: selectedPatientForDICOM.dateOfBirth ? new Date().getFullYear() - new Date(selectedPatientForDICOM.dateOfBirth).getFullYear() : 'Unknown',
                  sex: selectedPatientForDICOM.gender || 'Unknown'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Attach Report Modal - Handled by toolbar actions */}

      {/* Study Info Dialog */}
      {showStudyInfoDialog && selectedPatient && (
        <StudyInfoDialog
          open={showStudyInfoDialog}
          onClose={() => setShowStudyInfoDialog(false)}
          patientId={selectedPatient.id}
          patient={selectedPatient}
        />
      )}

      {/* Comments Dialog */}
      {selectedPatient && (
        <CommentsDialog
          patient={selectedPatient}
          isOpen={showCommentsDialog}
          onClose={() => setShowCommentsDialog(false)}
        />
      )}

      {/* View Report Dialog */}
      {selectedPatient && (
        <Dialog open={showViewReportDialog} onOpenChange={setShowViewReportDialog}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Patient Reports - {selectedPatient.name}
                  </DialogTitle>
                  <DialogDescription>
                    View existing reports for this patient (Report Status: {selectedPatient.reportStatus || 'N/A'})
                  </DialogDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    console.log('Refreshing reports for patient:', selectedPatient.id);
                    await refetchReports();
                    queryClient.invalidateQueries({ queryKey: ["/api/patients", selectedPatient.id, "reports"] });
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {(() => {
                console.log('Current patientReports:', patientReports);
                console.log('patientReports length:', patientReports?.length);
                console.log('reportsLoading:', reportsLoading);
                return null;
              })()}
              {reportsLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 text-blue-500 mx-auto mb-4 animate-spin" />
                  <p className="text-muted-foreground">Loading reports...</p>
                </div>
              ) : patientReports && patientReports.length > 0 ? (
                <div className="grid gap-4">
                  {patientReports.map((report: any) => (
                    <Card key={report.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-lg mb-2">{report.reportName || report.fileName}</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                              <div>
                                <p><strong>Created:</strong> {new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString()}</p>
                                <p><strong>Doctor:</strong> {report.doctorName || 'Unknown'}</p>
                              </div>
                              <div>
                                {report.templateName && (
                                  <p><strong>Template:</strong> {report.templateName}</p>
                                )}
                                <p><strong>File Size:</strong> {report.fileSize ? `${Math.round(report.fileSize / 1024)} KB` : 'Unknown'}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={report.status === 'finalized' ? 'default' : report.status === 'draft' ? 'secondary' : 'outline'}>
                                {report.status || 'draft'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {report.fileType === 'text/html' ? 'HTML Report' : 'Word Document'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2 ml-4">
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => {
                                setSelectedReportFile({
                                  url: report.fileUrl || `/api/files/${report.filePath}`,
                                  name: report.fileName || report.reportName
                                });
                                setShowWordDocumentViewer(true);
                                setShowViewReportDialog(false);
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Report
                            </Button>
                            {report.filePath && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => downloadReport(report)}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-blue-50 rounded-lg p-8 inline-block">
                    <FileText className="h-16 w-16 text-blue-300 mx-auto mb-4" />
                    <h3 className="font-medium text-lg mb-2">No Reports Available</h3>
                    <p className="text-muted-foreground mb-4">
                      This patient doesn't have any generated reports yet.
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Click the <strong>"Report"</strong> button to create a new report</p>
                      <p>• Select a template and generate your first report</p>
                      <p>• Generated reports will appear here for viewing</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => {
                        setShowViewReportDialog(false);
                        setShowReportTemplateModal(true);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Create First Report
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Report Template Selection Modal */}
      {selectedPatient && (
        <ReportTemplateSelectionModal
          open={showReportTemplateModal}
          onClose={() => setShowReportTemplateModal(false)}
          patient={selectedPatient}
          onTemplateSelected={(template, reportData) => {
            if (selectedPatient) {
              generateReportMutation.mutate({ template, reportData, patient: selectedPatient });
            }
          }}
        />
      )}

      {/* Word Document Viewer Modal */}
      {selectedReportFile && (
        <Dialog open={showWordDocumentViewer} onOpenChange={setShowWordDocumentViewer}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                {selectedReportFile.name}
              </DialogTitle>
              <DialogDescription>
                Word document report viewer
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <WordDocumentViewer
                fileUrl={selectedReportFile.url}
                fileName={selectedReportFile.name}
                onClose={() => {
                  setShowWordDocumentViewer(false);
                  setSelectedReportFile(null);
                }}
                height="70vh"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}