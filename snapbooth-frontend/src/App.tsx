import React, { useState } from 'react';
import { DSLRPanel } from './components/DSLRPanel';
import { SyphonTestPanel } from './components/SyphonTestPanel';

export default function App() {
  const [activePanel, setActivePanel] = useState<'dslr' | 'syphon-test'>('dslr');

  return (
    <div style={{ padding: 32 }}>
      <h1>DSLR Snapbooth</h1>
      
      {/* Panel Selection */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setActivePanel('dslr')}
          style={{
            padding: '8px 16px',
            marginRight: '8px',
            backgroundColor: activePanel === 'dslr' ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          DSLR Control Panel
        </button>
        <button
          onClick={() => setActivePanel('syphon-test')}
          style={{
            padding: '8px 16px',
            backgroundColor: activePanel === 'syphon-test' ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Syphon Test Panel
        </button>
      </div>

      {/* Active Panel */}
      {activePanel === 'dslr' ? <DSLRPanel /> : <SyphonTestPanel />}
    </div>
  );
} 