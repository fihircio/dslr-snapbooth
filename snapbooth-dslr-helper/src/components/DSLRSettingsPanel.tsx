import React, { useEffect, useState } from 'react';
import { getCameraSettings, setCameraSettings } from '../services/dslrService';

export function DSLRSettingsPanel() {
  const [settings, setSettings] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getCameraSettings()
      .then((data) => {
        setSettings(data);
        setForm(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load settings');
        setLoading(false);
      });
  }, []);

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await setCameraSettings(form);
      if (result.success) {
        setSuccess('Settings updated!');
        setSettings(form);
      } else {
        setError(result.message || 'Failed to update settings');
      }
    } catch (err) {
      setError('Failed to update settings');
    }
    setLoading(false);
  };

  if (loading && !settings) return <div>Loading camera settings...</div>;
  if (error && !settings) return <div style={{ color: 'red' }}>{error}</div>;
  if (!settings) return null;

  return (
    <div style={{ border: '1px solid #ccc', padding: 16, borderRadius: 8, maxWidth: 600 }}>
      <h3>Camera Settings</h3>
      <form onSubmit={handleSubmit}>
        {Object.entries(settings).map(([key, value]) => (
          <div key={key} style={{ marginBottom: 8 }}>
            <label>
              {key}: <input
                value={form[key] ?? ''}
                onChange={e => handleChange(key, e.target.value)}
                disabled={loading}
              />
            </label>
          </div>
        ))}
        <button type="submit" disabled={loading}>Update Settings</button>
      </form>
      {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </div>
  );
} 