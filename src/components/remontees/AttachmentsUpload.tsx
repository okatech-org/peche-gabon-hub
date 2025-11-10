import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, FileIcon, Image, Video, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { compressImage } from "@/lib/utils";

interface FileWithPreview {
  file: File;
  preview?: string;
  id: string;
}

interface AttachmentsUploadProps {
  files: FileWithPreview[];
  onFilesChange: (files: FileWithPreview[]) => void;
  maxFiles?: number;
  maxSize?: number; // en MB
}

const ACCEPTED_TYPES = {
  "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  "video/*": [".mp4", ".mov"],
  "application/pdf": [".pdf"],
};

export function AttachmentsUpload({
  files,
  onFilesChange,
  maxFiles = 5,
  maxSize = 20,
}: AttachmentsUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);

    // Vérifier le nombre de fichiers
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Vous ne pouvez ajouter que ${maxFiles} fichiers maximum`);
      return;
    }

    setUploading(true);
    
    try {
      // Compresser et traiter les fichiers
      const processedFiles: FileWithPreview[] = await Promise.all(
        selectedFiles.map(async (file) => {
          const id = Math.random().toString(36).substring(7);
          
          // Compresser les images
          let processedFile = file;
          if (file.type.startsWith("image/")) {
            try {
              const originalSize = file.size / (1024 * 1024);
              processedFile = await compressImage(file, maxSize * 0.8, 1920);
              const compressedSize = processedFile.size / (1024 * 1024);
              
              if (compressedSize < originalSize) {
                toast.success(`Image compressée: ${originalSize.toFixed(2)}MB → ${compressedSize.toFixed(2)}MB`);
              }
            } catch (error) {
              console.error("Erreur lors de la compression:", error);
              toast.warning("Compression échouée, utilisation de l'image originale");
            }
          }
          
          // Vérifier la taille après compression
          if (processedFile.size > maxSize * 1024 * 1024) {
            toast.error(`${processedFile.name} dépasse la taille maximale de ${maxSize}MB`);
            return null;
          }
          
          // Créer preview pour les images
          if (processedFile.type.startsWith("image/")) {
            return new Promise<FileWithPreview>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                resolve({
                  file: processedFile,
                  preview: reader.result as string,
                  id,
                });
              };
              reader.readAsDataURL(processedFile);
            });
          }
          
          return {
            file: processedFile,
            id,
          };
        })
      );

      // Filtrer les fichiers null (trop gros)
      const validFiles = processedFiles.filter((f): f is FileWithPreview => f !== null);
      
      if (validFiles.length > 0) {
        onFilesChange([...files, ...validFiles]);
      }
    } catch (error) {
      console.error("Erreur lors du traitement des fichiers:", error);
      toast.error("Erreur lors du traitement des fichiers");
    } finally {
      setUploading(false);
      
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemove = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <Image className="h-5 w-5" />;
    } else if (file.type.startsWith("video/")) {
      return <Video className="h-5 w-5" />;
    } else if (file.type === "application/pdf") {
      return <FileText className="h-5 w-5" />;
    }
    return <FileIcon className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Pièces jointes (optionnel)</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Photos, vidéos ou PDF ({maxFiles} fichiers max, {maxSize}MB par fichier)
        </p>
        
        <div className="space-y-3">
          {files.length < maxFiles && (
            <div>
              <Input
                ref={inputRef}
                type="file"
                accept={Object.keys(ACCEPTED_TYPES).join(",")}
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <Label htmlFor="file-upload">
                <div className="border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center gap-2 text-center">
                    {uploading ? (
                      <>
                        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                        <div className="text-sm text-muted-foreground">
                          Compression et traitement des images...
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <div className="text-sm">
                          <span className="font-medium text-primary">Cliquez pour ajouter</span>
                          <span className="text-muted-foreground"> ou glissez-déposez</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Images (compression auto), vidéos (MP4) ou PDF
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </Label>
            </div>
          )}

          {/* Liste des fichiers */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((fileData) => (
                <div
                  key={fileData.id}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                >
                  {fileData.preview ? (
                    <img
                      src={fileData.preview}
                      alt={fileData.file.name}
                      className="h-12 w-12 object-cover rounded"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-primary/10 rounded flex items-center justify-center">
                      {getFileIcon(fileData.file)}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {fileData.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(fileData.file.size)}
                    </p>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(fileData.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
