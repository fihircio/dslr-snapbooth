// services/uploadService.ts

export async function uploadPhotoToPHP(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  // Adjust the endpoint as needed for your PHP backend
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  return res.json();
} 