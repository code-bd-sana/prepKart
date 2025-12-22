'use client';
import { useState } from 'react';
import { toast } from 'react-toastify';

export default function ImageUploader({ onImageUploaded }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64 = reader.result;
        
        const res = await fetch('/api/upload/cloudinary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64 })
        });
        
        const data = await res.json();
        if (res.ok) {
          onImageUploaded(data.url);
          toast.success('Image uploaded successfully');
        } else {
          toast.error('Upload failed');
        }
      };
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        className="hidden"
        id="image-upload"
      />
      <label
        htmlFor="image-upload"
        className={`cursor-pointer px-4 py-2 border rounded-lg inline-block ${
          uploading ? 'bg-gray-100' : 'hover:bg-gray-50'
        }`}
      >
        {uploading ? 'Uploading...' : 'Upload Image'}
      </label>
    </div>
  );
}