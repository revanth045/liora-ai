import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { toast } from '../lib/toast';

export default function DevDataBackup() {
    const [status, setStatus] = useState<'idle' | 'exported' | 'imported'>('idle');

    const handleExport = () => {
        const keys = Object.keys(localStorage);
        const data: Record<string, string> = {};
        keys.forEach(k => { const v = localStorage.getItem(k); if (v) data[k] = v; });
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `liora-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setStatus('exported');
        setTimeout(() => setStatus('idle'), 2000);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result as string);
                Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v as string));
                setStatus('imported');
                setTimeout(() => window.location.reload(), 1000);
            } catch {
                toast.error('Invalid backup file');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="bg-cream-50 border border-cream-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
                <Icon name="database" className="w-4 h-4 text-brand-400" />
                Data Backup
            </h3>
            <div className="flex gap-2">
                <button onClick={handleExport} className="flex-1 py-2 text-xs font-semibold rounded-lg bg-cream-50 border border-cream-200-light hover:bg-cream-200/60 text-stone-600 transition-colors">
                    Export
                </button>
                <label className="flex-1 py-2 text-xs font-semibold rounded-lg bg-cream-50 border border-cream-200-light hover:bg-cream-200/60 text-stone-600 transition-colors text-center cursor-pointer">
                    Import
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
            </div>
            {status !== 'idle' && (
                <p className="text-xs text-brand-400 text-center">{status === 'exported' ? 'Backup downloaded!' : 'Data restored, reloading...'}</p>
            )}
        </div>
    );
}
