"use client";

import { UploadCloud, File as FileIcon, X } from "lucide-react";
import * as React from "react";
import { useDropzone, type DropzoneOptions, type FileRejection } from "react-dropzone";
import { twMerge } from "tailwind-merge";
import { Button } from "./ui/button";

const variants = {
  base: "relative rounded-lg p-4 flex justify-center items-center flex-col cursor-pointer min-h-[6rem] w-full border-2 border-dashed border-muted-foreground/50 text-center transition-colors duration-200 ease-in-out",
  active: "border-primary",
  disabled: "bg-muted/50 cursor-default pointer-events-none",
  accept: "border-green-500 bg-green-500/10",
  reject: "border-red-500 bg-red-500/10",
};

type FileWithPreview = File & { preview: string };

type FileUploaderProps = {
  className?: string;
  value?: File[];
  onChange?: (files: File[]) => void;
  disabled?: boolean;
  dropzoneOptions?: Omit<DropzoneOptions, "disabled" | "onDrop">;
};

const FileUploader = React.forwardRef<HTMLInputElement, FileUploaderProps>(
  ({ className, value = [], onChange, disabled, dropzoneOptions }, ref) => {
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [filesWithPreview, setFilesWithPreview] = React.useState<FileWithPreview[]>([]);

    const onDrop = React.useCallback(
      (acceptedFiles: File[], fileRejections: FileRejection[]) => {
        setErrorMessage(null);
        if (fileRejections.length > 0) {
          const firstError = fileRejections[0].errors[0];
          let message = firstError.message;
          if (firstError.code === 'file-too-large' && dropzoneOptions?.maxSize) {
            message = `El archivo es demasiado grande. El tamaño máximo es ${Math.round(dropzoneOptions.maxSize / 1024 / 1024)}MB.`;
          } else if (firstError.code === 'file-invalid-type') {
            message = "Tipo de archivo no válido.";
          }
          setErrorMessage(message);
          return;
        }

        if (acceptedFiles.length > 0) {
          const newFiles = [...value, ...acceptedFiles];
          onChange?.(newFiles);
        }
      },
      [value, onChange, dropzoneOptions]
    );

    const {
      getRootProps,
      getInputProps,
      isDragActive,
      isDragAccept,
      isDragReject,
    } = useDropzone({
      onDrop,
      disabled,
      ...dropzoneOptions,
    });
    
    React.useEffect(() => {
      // This effect handles creating and revoking preview URLs
      if (!value || value.length === 0) {
        setFilesWithPreview([]);
        return;
      }
      
      const newFilesWithPreview = value.map(file => Object.assign(file, {
          preview: URL.createObjectURL(file)
      }));
      setFilesWithPreview(newFilesWithPreview);

      // Cleanup function to revoke the object URLs to avoid memory leaks
      return () => {
        newFilesWithPreview.forEach(file => URL.revokeObjectURL(file.preview));
      };
    }, [value]);


    const dropZoneClassName = React.useMemo(
      () =>
        twMerge(
          variants.base,
          isDragActive && variants.active,
          isDragAccept && variants.accept,
          (isDragReject || !!errorMessage) && variants.reject,
          disabled && variants.disabled,
          className
        ).trim(),
      [isDragActive, isDragAccept, isDragReject, errorMessage, disabled, className]
    );

    const removeFile = (index: number) => {
      if (!value) return;
      const newFiles = value.filter((_, i) => i !== index);
      onChange?.(newFiles);
    };

    return (
      <div className="flex flex-col gap-4">
        <div {...getRootProps({ className: dropZoneClassName })}>
          <input ref={ref} {...getInputProps()} />
            <div className="flex flex-col items-center justify-center text-center">
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-sm text-foreground">
                <span className="font-semibold">Arrastra y suelta</span> o haz clic para añadir
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                Soporta TXT, PDF e imágenes.
                </p>
                {errorMessage && (
                <p className="mt-2 text-xs font-semibold text-destructive">{errorMessage}</p>
                )}
            </div>
        </div>
        {filesWithPreview.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Archivos subidos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filesWithPreview.map((file, index) => (
                <div key={`${file.name}-${index}`} className="relative group aspect-square rounded-lg border bg-card overflow-hidden">
                    {file.type.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={file.preview}
                            alt={file.name}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-2">
                            <FileIcon className="h-10 w-10 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground mt-2 break-all">{file.name}</p>
                        </div>
                    )}
                    {!disabled && (
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                            }}
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

FileUploader.displayName = "FileUploader";

export { FileUploader };