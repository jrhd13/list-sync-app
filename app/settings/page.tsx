'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [syncLoading, setSyncLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setSyncLoading(true);
    setMessage('🔄 Contacting indexers...');
    
    try {
      // This hits your API and tells it to bypass the cache
      const res = await fetch('/api/elite-list?force=true');
      if (res.ok) {
        setMessage('✅ Sync Complete! Radarr is now updated.');
      } else {
        setMessage('❌ Sync failed. Check your API keys.');
      }
    } catch (err) {
      setMessage('❌ Error connecting to server.');
    } finally {
      setSyncLoading(false);
      // Clear the message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">App Settings</h1>
        <p className="text-gray-400 mb-8">Manage your Elite List synchronization.</p>

        <div className="space-y-6">
          {/* Release Groups Info Box */}
          <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
            <h2 className="text-xl font-semibold mb-2">Release Groups</h2>
            <p className="text-sm text-gray-400 mb-4">
              Your groups (like NTb and PiRaTeS) are managed in your Supabase Dashboard.
            </p>
            <a 
              href="https://supabase.com/dashboard" 
              target="_blank" 
              className="text-blue-400 hover:underline text-sm"
            >
              Go to Supabase Dashboard →
            </a>
          </div>

          {/* Sync Button Box */}
          <div className="p-6 bg-gray-900 border border-blue-900/30 rounded-xl">
            <h2 className="text-xl font-semibold mb-2 text-blue-400">Force Manual Sync</h2>
            <p className="text-sm text-gray-400 mb-6">
              Use this if you just added a group to Supabase and don't want to wait for the next scheduled check.
            </p>
            
            <button 
              onClick={handleSync}
              disabled={syncLoading}
              className={`w-full py-4 rounded-lg font-bold transition-all ${
                syncLoading 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg active:scale-[0.98]'
              }`}
            >
              {syncLoading ? 'Syncing...' : 'Sync Now'}
            </button>

            {message && (
              <p className="mt-4 text-center font-medium text-blue-300 animate-pulse">
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}