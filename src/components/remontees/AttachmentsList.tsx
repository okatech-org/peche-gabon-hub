import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Video, FileText, Download, ExternalLink, Loader2, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageGallery } from "./ImageGallery";

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

interface AttachmentsListProps {
  remonteeId: string;
}

export function AttachmentsList({ remonteeId }: AttachmentsListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    loadAttachments();
  }, [remonteeId]);

  const loadAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from("remontees_attachments")
        .select("*")
        .eq("remontee_id", remonteeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error: any) {
      console.error("Error loading attachments:", error);
      toast.error("Erreur lors du chargement des pièces jointes");
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (mimeType.startsWith("video/")) {
      return <Video className="h-5 w-5 text-purple-500" />;
    } else if (mimeType === "application/pdf") {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <Paperclip className="h-5 w-5" />;
  };

  const imageAttachments = attachments
    .filter((att) => att.mime_type.startsWith("image/"))
    .map((att) => ({
      url: supabase.storage.from("remontees-attachments").getPublicUrl(att.file_path).data.publicUrl,
      name: att.file_name,
    }));

  const openGallery = (attachment: Attachment) => {
    const publicUrl = supabase.storage.from("remontees-attachments").getPublicUrl(attachment.file_path).data.publicUrl;
    const index = imageAttachments.findIndex((img) => img.url === publicUrl);
    if (index !== -1) {
      setGalleryIndex(index);
      setGalleryOpen(true);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleView = async (attachment: Attachment) => {
    try {
      const { data } = await supabase.storage
        .from("remontees-attachments")
        .getPublicUrl(attachment.file_path);

      window.open(data.publicUrl, "_blank");
    } catch (error: any) {
      console.error("Error viewing attachment:", error);
      toast.error("Erreur lors de l'ouverture du fichier");
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from("remontees-attachments")
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error downloading attachment:", error);
      toast.error("Erreur lors du téléchargement du fichier");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (attachments.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Pièces jointes ({attachments.length})
            </h4>
            
            <div className="space-y-2">
              {attachments.map((attachment) => {
                const isImage = attachment.mime_type.startsWith("image/");
                const publicUrl = supabase.storage.from("remontees-attachments").getPublicUrl(attachment.file_path).data.publicUrl;
                
                return (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
                  >
                    {isImage ? (
                      <button
                        onClick={() => openGallery(attachment)}
                        className="relative h-12 w-12 rounded overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-primary transition-all"
                      >
                        <img
                          src={publicUrl}
                          alt={attachment.file_name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ) : (
                      <div className="h-12 w-12 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                        {getFileIcon(attachment.mime_type)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.file_size)}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      {isImage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openGallery(attachment)}
                          title="Voir en galerie"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                      )}
                      {(isImage || attachment.mime_type === "application/pdf") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(attachment)}
                          title="Ouvrir"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(attachment)}
                        title="Télécharger"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <ImageGallery
        images={imageAttachments}
        initialIndex={galleryIndex}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
    </>
  );
}
