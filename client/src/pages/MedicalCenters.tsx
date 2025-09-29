import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { withPermissions } from "@/hooks/usePermissions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMedicalCenterSchema, type MedicalCenter } from "@shared/schema";
import { z } from "zod";
import { Plus, Edit2, Building2 } from "lucide-react";

const formSchema = insertMedicalCenterSchema;

interface MedicalCenterFormProps {
  center?: MedicalCenter;
  onSuccess: () => void;
  onCancel: () => void;
}

function MedicalCenterForm({ center, onSuccess, onCancel }: MedicalCenterFormProps) {
  const { toast } = useToast();
  const isEditing = !!center;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: center?.name || "",
      code: center?.code || "",
      address: center?.address || "",
      phone: center?.phone || "",
      email: center?.email || "",
      isActive: center?.isActive ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const url = isEditing ? `/api/medical-centers/${center.id}` : "/api/medical-centers";
      const method = isEditing ? "PUT" : "POST";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-centers"] });
      toast({
        title: "Success",
        description: `Medical center ${isEditing ? "updated" : "created"} successfully`,
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} medical center`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Center Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter center name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Center Code *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., DEESA, RMSACHORE" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter complete address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Active centers will appear in patient forms
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function MedicalCentersManagement() {
  const { toast } = useToast();
  const [selectedCenter, setSelectedCenter] = useState<MedicalCenter | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: centersResponse, isLoading } = useQuery({
    queryKey: ["/api/medical-centers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/medical-centers");
      return response.json();
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PUT", `/api/medical-centers/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-centers"] });
      toast({
        title: "Success",
        description: "Center status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update center status",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (center: MedicalCenter) => {
    setSelectedCenter(center);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedCenter(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedCenter(null);
  };

  const centers = centersResponse?.data || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Centers</h1>
          <p className="text-gray-600">Manage medical centers and facilities</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Center
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Medical Centers ({centers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading centers...</div>
          ) : centers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No medical centers found</h3>
              <p className="text-sm">Add your first medical center to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {centers.map((center: MedicalCenter) => (
                <div
                  key={center.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="font-medium">{center.name}</h3>
                        <p className="text-sm text-gray-600">Code: {center.code}</p>
                        {center.address && (
                          <p className="text-sm text-gray-500">{center.address}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      {center.phone && (
                        <span className="text-xs text-gray-500">📞 {center.phone}</span>
                      )}
                      {center.email && (
                        <span className="text-xs text-gray-500">✉️ {center.email}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge variant={center.isActive ? "default" : "secondary"}>
                      {center.isActive ? "Active" : "Inactive"}
                    </Badge>
                    
                    <Switch
                      checked={center.isActive}
                      onCheckedChange={(checked) =>
                        toggleStatusMutation.mutate({ id: center.id, isActive: checked })
                      }
                      disabled={toggleStatusMutation.isPending}
                    />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(center)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCenter ? "Edit Medical Center" : "Add Medical Center"}
            </DialogTitle>
          </DialogHeader>
          <MedicalCenterForm
            center={selectedCenter}
            onSuccess={handleDialogClose}
            onCancel={handleDialogClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withPermissions(MedicalCentersManagement, {
  menu: 'settings',
  module: 'settings',
  action: 'view'
});