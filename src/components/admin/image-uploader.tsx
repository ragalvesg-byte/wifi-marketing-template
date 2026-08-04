"use client";

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, X, RefreshCw, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}

export function ImageUploader({ value, onChange, folder = 'general', label = 'Imagem' }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formato inválido. Use JPG, PNG ou WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Limite de 5MB.');
      return;
    }

    if (!supabase) {
      setError('Supabase não configurado. Use a URL manual no modo avançado.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const ext = file.name.split('.').pop();
      const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 15);
      const fileName = `${folder}/${uniqueId}.${ext}`;

      const { data, error: uploadError } = await supabase.storage
        .from('portal-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('portal-media')
        .getPublicUrl(fileName);

      onChange(publicUrlData.publicUrl);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao fazer upload da imagem.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold uppercase text-slate-600">{label}</label>

      {!isAdvanced ? (
        <div className="space-y-3">
          {value ? (
            <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center min-h-[120px]">
              <img src={value} alt="Preview" className="w-full h-full object-contain max-h-[200px]" />
              
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors tooltip-trigger"
                  title="Substituir"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-2 bg-rose-500/80 hover:bg-rose-500 text-white rounded-full transition-colors tooltip-trigger"
                  title="Remover"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <Upload className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-sm font-semibold">Clique para fazer upload</span>
              <span className="text-xs opacity-70 mt-1">JPG, PNG, WebP (máx 5MB)</span>
            </div>
          )}

          {isUploading && (
            <div className="text-xs text-blue-600 font-semibold flex items-center gap-2 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Enviando imagem...
            </div>
          )}

          {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />

          <button 
            type="button" 
            onClick={() => setIsAdvanced(true)} 
            className="text-[10px] text-slate-400 hover:text-slate-600 underline font-medium"
          >
            Usar URL externa em vez de upload
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input 
              type="url" 
              value={value || ''} 
              onChange={(e) => onChange(e.target.value)} 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" 
              placeholder="https://" 
            />
          </div>
          <button 
            type="button" 
            onClick={() => setIsAdvanced(false)} 
            className="text-[10px] text-slate-400 hover:text-slate-600 underline font-medium flex items-center gap-1"
          >
            <ImageIcon className="w-3 h-3" /> Voltar para o Upload Seguro
          </button>
        </div>
      )}
    </div>
  );
}
