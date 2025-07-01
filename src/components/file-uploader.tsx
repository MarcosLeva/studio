"use client";

import { UploadCloud, File as FileIcon, X } from "lucide-react";
import * as React from "react";
import { useDropzone, type DropzoneOptions, type FileRejection } from "react-dropzone";
import { twMerge } from "tailwind-merge";
import Image from "next/image";

const variants = {
  base: "relative rounded-lg p-4 flex justify-center items-center flex-col cursor-pointer min-h-32 w-full border-2 border-dashed border-muted-foreground/50 text-center transition-colors duration-200 ease-in-out",
  active: "border-primary",
  disabled: "bg-muted/50 cursor-default pointer-events-none",
  accept: "border-green-500 bg-green-500/10",
  reject: "border-red-500 bg-red-500/10",
};

type FileUploaderProps = {
  className?: string;
  value?: File;
  onChange?: (file?: File) => void;
  disabled?: boolean;
  dropzoneOptions?: Omit<DropzoneOptions, "disabled" | "onDrop">;
};

const FileUploader = React.forwardRef<HTMLInputElement, FileUploaderProps>(
  ({ className, value, onChange, disabled, dropzoneOptions }, ref) => {
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    const preview = React.useMemo(() => {
        if (value && value.type.startsWith("image/")) {
            return URL.createObjectURL(value);
        }
        return null;
    }, [value]);

    React.useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const onDrop = React.useCallback(
      (acceptedFiles: File[], fileRejections: FileRejection[]) => {
        setErrorMessage(null); // Clear previous errors
        if (fileRejections.length > 0) {
          const firstError = fileRejections[0].errors[0];
          let message = firstError.message;
          if (firstError.code === 'file-too-large' && dropzoneOptions?.maxSize) {
            message = `El archivo es demasiado grande. El tamaño máximo es ${Math.round(dropzoneOptions.maxSize / 1024 / 1024)}MB.`;
          } else if (firstError.code === 'file-invalid-type') {
            message = "Tipo de archivo no válido.";
          }
          setErrorMessage(message);
          onChange?.(undefined);
          return;
        }

        if (acceptedFiles.length > 0) {
          onChange?.(acceptedFiles[0]);
        }
      },
      [onChange, dropzoneOptions]
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
    
    // Reset error message when the file is removed externally
    React.useEffect(() => {
      if (!value) {
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
          value && !errorMessage ? "p-0 border-solid" : "",
          className
        ).trim(),
      [isDragActive, isDragAccept, isDragReject, errorMessage, disabled, value, className]
    );

    const removeFile = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onChange?.(undefined);
    };
    
    const hasFile = value && !errorMessage;

    return (
      <div {...getRootProps({ className: dropZoneClassName })}>
        <input ref={ref} {...getInputProps()} />
        {hasFile ? (
            <div className="relative h-full w-full flex items-center justify-center">
                 {preview ? (
                    <Image
                        src={preview}
                        alt={value.name}
                        fill
                        className="rounded-md object-contain"
                    />
                 ) : (
                    <div className="flex flex-col items-center justify-center p-4 h-full w-full space-y-2">
                        <div className="flex items-center justify-center rounded-full bg-muted p-3">
                          <FileIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground truncate">{value.name}</p>
                          <p className="text-xs text-muted-foreground">
                              {Math.round(value.size / 1024)} KB
                          </p>
                        </div>
                    </div>
                 )}
                 {!disabled && (
                    <button
                        type="button"
                        onClick={removeFile}
                        className="absolute -right-2 -top-2 z-10 rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-md transition-colors hover:bg-destructive/80"
                    >
                        <X className="h-4 w-4" />
                    </button>
                 )}
            </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <p className="mt-4 text-sm text-foreground">
              <span className="font-semibold">Arrastra y suelta</span> o haz clic
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Soporta TXT, PDF e imágenes.
            </p>
            {errorMessage && (
              <p className="mt-2 text-xs font-semibold text-destructive">{errorMessage}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

FileUploader.displayName = "FileUploader";

export { FileUploader };
