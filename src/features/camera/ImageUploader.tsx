import { useCallback } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onUpload: (imageDataUrl: string) => void;
  accept?: string;
  className?: string;
}

export function ImageUploader({
  onUpload,
  accept = 'image/*',
  className = '',
}: ImageUploaderProps) {
  const handleFileChange = useCallback(
    (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          if (dataUrl) {
            onUpload(dataUrl);
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [onUpload]
  );

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = handleFileChange;
    input.click();
  };

  return (
    <div
      onClick={handleClick}
      className={`border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors ${className}`}
    >
      <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
      <p className="text-gray-600 font-medium">点击上传图片</p>
      <p className="text-gray-400 text-sm mt-1">支持 JPG、PNG 格式</p>
    </div>
  );
}
