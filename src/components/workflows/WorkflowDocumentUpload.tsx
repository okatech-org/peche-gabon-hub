import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface WorkflowDocumentUploadProps {
  workflowId: string;
  onUploadComplete: () => void;
}

export function WorkflowDocumentUpload({ workflowId, onUploadComplete }: WorkflowDocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Vérifier la taille (max 20MB)
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast.error("Le fichier est trop volumineux (max 20MB)");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);

    try {
      // 1. Upload vers Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${workflowId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('workflow-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Enregistrer dans la table workflow_documents
      const { error: dbError } = await supabase
        .from('workflow_documents')
        .insert({
          workflow_id: workflowId,
          nom_fichier: file.name,
          type_fichier: file.type || 'application/octet-stream',
          taille_bytes: file.size,
          url_fichier: fileName,
          uploaded_by: user.id,
        } as any);

      if (dbError) throw dbError;

      // 3. Logger dans l'historique
      await supabase.rpc('log_action', {
        _action: 'document_ajoute',
        _resource_type: 'workflow',
        _resource_id: workflowId,
        _details: {
          nom_fichier: file.name,
          taille_bytes: file.size,
        },
      });

      toast.success("Document ajouté avec succès");
      setFile(null);
      
      // Reset input
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) input.value = '';
      
      onUploadComplete();
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast.error(error.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
      <div className="space-y-2">
        <Label htmlFor="document-upload">Ajouter un Document</Label>
        <Input
          id="document-upload"
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
        />
        {file && (
          <p className="text-sm text-muted-foreground">
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>
      
      <Button
        onClick={handleUpload}
        disabled={!file || uploading}
        size="sm"
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Upload en cours...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Téléverser le Document
          </>
        )}
      </Button>
    </div>
  );
}