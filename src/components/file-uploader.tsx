"use client";

import { UploadCloud, File as FileIcon, X } from "lucide-react";
import * as React from "react";
import { useDropzone, type DropzoneOptions, type FileRejection } from "react-dropzone";
import { twMerge } from "tailwind-merge";

const variants = {
  base: "relative rounded-lg p-4 flex justify-center items-center flex-col cursor-pointer min-h-[6rem] w-full border-2 border-dashed border-muted-foreground/50 text-center transition-colors duration-200 ease-in-out",
  active: "border-primary",
  disabled: "bg-muted/50 cursor-default pointer-events-none",
  accept: "border-green-500 bg-green-500/10",
  reject: "border-red-500 bg-red-500/10",
};

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
          const newFiles = [...(value || []), ...acceptedFiles];
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
      if (!value?.length) {
        setErrorMessage(null);
      }
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
        {value && value.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Archivos subidos</h3>
            <div className="flex flex-col gap-2">
              {value.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 rounded-lg border bg-card p-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileIcon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    <div className="flex min-w-0 flex-col text-sm">
                      <span className="font-medium truncate">{file.name}</span>
                      <span className="text-muted-foreground text-xs">{Math.round(file.size / 1024)} KB</span>
                    </div>
                  </div>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 text-destructive rounded-full hover:bg-destructive/10 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
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