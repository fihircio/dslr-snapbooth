import React, { useEffect, useState } from 'react';
import { listDSLRImages, getDSLRImageDownloadUrl } from '../services/dslrService';
import type { DSLRImageInfo } from '../services/dslrService';

export function DSLRGalleryPanel() {
  const [images, setImages] = useState<DSLRImageInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listDSLRImages()
      .then((result) => {
        if (result.success && Array.isArray(result.images)) {
          setImages(result.images);
        } else {
          setError(result.message || 'Failed to list images');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to list images');
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ border: '1px solid #ccc', padding: 16, borderRadius: 8, margin: '16px 0' }}>
      <h3>Camera Gallery</h3>
      {loading && <div>Loading images...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {images.length > 0 ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {images.map((img) => (
            <div key={img.number} style={{ textAlign: 'center' }}>
              <img
                src={getDSLRImageDownloadUrl(img)}
                alt={img.name}
                style={{ maxWidth: 120, border: '1px solid #aaa', display: 'block', marginBottom: 4 }}
              />
              <a href={getDSLRImageDownloadUrl(img)} download>
                Download
              </a>
              <div style={{ fontSize: 12, color: '#555' }}>{img.name}</div>
            </div>
          ))}
        </div>
      ) : (
        !loading && <div>No images found.</div>
      )}
    </div>
  );
} 