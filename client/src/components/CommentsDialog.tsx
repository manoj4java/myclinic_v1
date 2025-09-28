import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageSquare,
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Stethoscope,
  Save,
  X,
  Clock,
  Loader2
} from "lucide-react";

interface PatientComment {
  id: string;
  patientId: string;
  doctorId: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  doctorName: string;
}

interface CommentsDialogProps {
  patient: any;
  isOpen: boolean;
  onClose: () => void;
}

export function CommentsDialog({ patient, isOpen, onClose }: CommentsDialogProps) {
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch patient comments
  const { data: commentsList = [], isLoading: isLoadingComments, refetch } = useQuery({
    queryKey: ["/api/patients", patient?.id, "comments"],
    queryFn: async () => {
      if (!patient?.id) return [];
      const response = await apiRequest("GET", `/api/patients/${patient.id}/comments`);
      return response.json();
    },
    enabled: !!patient?.id && isOpen,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (comment: string) => {
      console.log('[DEBUG] Sending comment:', comment);
      console.log('[DEBUG] Request payload:', { comment });
      console.log('[DEBUG] Patient ID:', patient.id);
      
      const response = await apiRequest("POST", `/api/patients/${patient.id}/comments`, {
        comment,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Comment added successfully.",
      });
      setNewComment("");
      // Refetch comments to get the updated list
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'N/A';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const handleSave = async () => {
    if (!newComment.trim()) {
      toast({
        title: "Warning",
        description: "Please enter a comment before saving.",
        variant: "destructive",
      });
      return;
    }

    addCommentMutation.mutate(newComment.trim());
  };

  const handleCancel = () => {
    setNewComment("");
    onClose();
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!patient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center space-x-2 text-lg">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>Patient Comments - {patient.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(85vh-120px)]">
          {/* Left Side - Patient Details (2/5 width) */}
          <div className="lg:col-span-2 space-y-2">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Patient Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {/* Basic Info - More compact grid */}
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Name:</span>
                    <span className="font-semibold">{patient.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">ID:</span>
                    <span className="font-mono text-xs">{patient.id?.slice(0, 8) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Age:</span>
                    <span>{getAge(patient.dateOfBirth)} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Gender:</span>
                    <span className="capitalize">{patient.gender || 'N/A'}</span>
                  </div>
                </div>

                <Separator className="my-2" />

                {/* Contact Info - Compact */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-gray-500" />
                      <span className="font-medium text-gray-600 text-xs">Phone:</span>
                    </div>
                    <span className="text-xs">{patient.phone || 'N/A'}</span>
                  </div>

                  {patient.email && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-gray-500" />
                        <span className="font-medium text-gray-600 text-xs">Email:</span>
                      </div>
                      <span className="text-xs truncate">{patient.email}</span>
                    </div>
                  )}
                </div>

                <Separator className="my-2" />

                {/* Medical Info - Compact */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Stethoscope className="w-3 h-3 text-gray-500" />
                      <span className="font-medium text-gray-600 text-xs">Specialty:</span>
                    </div>
                    <span className="text-xs capitalize">{patient.specialty || 'General'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      <span className="font-medium text-gray-600 text-xs">Registered:</span>
                    </div>
                    <span className="text-xs">
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {patient.emergency && (
                    <div className="mt-2">
                      <Badge className="bg-red-500 text-white text-xs px-2 py-1">
                        Emergency Case
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Comments (3/5 width) */}
          <div className="lg:col-span-3 flex flex-col space-y-3">
            {/* Previous Comments List */}
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <span>Previous Comments ({commentsList.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <ScrollArea className="h-48 pr-2">
                  {isLoadingComments ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-sm text-gray-500">Loading comments...</span>
                    </div>
                  ) : commentsList.length > 0 ? (
                    <div className="space-y-3">
                      {commentsList.map((comment: PatientComment) => (
                        <div key={comment.id} className="border-l-2 border-blue-200 pl-3 pb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-blue-700">{comment.doctorName}</span>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimestamp(comment.createdAt)}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 text-sm py-8">
                      No previous comments found.
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* New Comment Input */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Add New Comment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Enter your comment about the patient..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px] resize-none text-sm"
                  disabled={addCommentMutation.isPending}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {newComment.length} characters
                  </span>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCancel}
                      disabled={addCommentMutation.isPending}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleSave}
                      disabled={addCommentMutation.isPending || !newComment.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {addCommentMutation.isPending ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Save className="w-3 h-3 mr-1" />
                      )}
                      {addCommentMutation.isPending ? 'Saving...' : 'Save Comment'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}