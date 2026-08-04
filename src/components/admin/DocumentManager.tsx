import React, { useState, useEffect } from 'react';
import { storageService, DOCUMENTS_BUCKET_NAME } from '../../lib/storage';
import { FileText, Upload, Download, Trash2, Eye, Copy, Check, RefreshCw, Folder, FileCheck, Shield, AlertCircle } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

interface StoredDocument {
  name: string;
  publicUrl: string;
  path: string;
  created_at?: string;
  size?: number;
}

export const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState<string>('all');
  const [uploadFolder, setUploadFolder] = useState<string>('general');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<StoredDocument | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [folder]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let docs: StoredDocument[] = [];
      if (folder === 'all') {
        const folders = ['general', 'schema', 'reports', 'certificates'];
        for (const f of folders) {
          const list = await storageService.listDocuments(f);
          docs = [...docs, ...list];
        }
        // Also list root
        const rootDocs = await storageService.listDocuments('');
        docs = [...docs, ...rootDocs];
      } else {
        docs = await storageService.listDocuments(folder === 'root' ? '' : folder);
      }
      
      // Deduplicate by path
      const uniqueDocs = Array.from(new Map(docs.map(item => [item.path, item])).values());
      setDocuments(uniqueDocs);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setNotification({ msg: 'Please select a document file to upload.', type: 'error' });
      return;
    }

    setIsUploading(true);
    setNotification(null);
    try {
      const result = await storageService.uploadDocument(selectedFile, uploadFolder);
      if (result) {
        setNotification({
          msg: `Document "${selectedFile.name}" successfully uploaded to Supabase "${DOCUMENTS_BUCKET_NAME}" bucket!`,
          type: 'success'
        });
        setSelectedFile(null);
        fetchDocuments();
      } else {
        setNotification({ msg: 'Failed to upload document. Please try again.', type: 'error' });
      }
    } catch (err) {
      console.error('Upload document error:', err);
      setNotification({ msg: 'Error uploading document.', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc: StoredDocument) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.name}" from Supabase documents storage?`)) return;

    try {
      const success = await storageService.deleteDocument(doc.path);
      if (success) {
        setNotification({ msg: `Deleted "${doc.name}" successfully.`, type: 'success' });
        fetchDocuments();
      } else {
        setNotification({ msg: 'Failed to delete document.', type: 'error' });
      }
    } catch (err) {
      console.error('Error deleting doc:', err);
    }
  };

  const handleCopyUrl = (url: string, path: string) => {
    navigator.clipboard.writeText(url);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2500);
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded-md">
              Bucket: {DOCUMENTS_BUCKET_NAME}
            </span>
            {isSupabaseConfigured && (
              <span className="flex items-center text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <Shield className="w-3 h-3 mr-1" /> Active Storage Sync
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mt-1">Farm Documents & Reports Vault</h3>
          <p className="text-xs text-slate-500">
            Upload, store, download, and manage official farm PDFs, licenses, and veterinary reports in Supabase Storage.
          </p>
        </div>

        <button
          onClick={fetchDocuments}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Documents
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
          notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <FileCheck className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{notification.msg}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
        <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-2">
          <Upload className="w-4 h-4 text-emerald-700" /> Upload New Document to Storage
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Storage Folder</label>
            <select
              value={uploadFolder}
              onChange={e => setUploadFolder(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600"
            >
              <option value="general">general (General Docs)</option>
              <option value="schema">schema (SQL Schemas)</option>
              <option value="reports">reports (Veterinary / Financial)</option>
              <option value="certificates">certificates (Breeding & Farm Permits)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Select File (.pdf, .sql, .doc, .png, .jpg)</label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isUploading || !selectedFile}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Uploading to Bucket...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" /> Upload Document
              </>
            )}
          </button>
        </div>
      </form>

      {/* Document Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-bold text-slate-500 mr-2 flex items-center">
          <Folder className="w-3.5 h-3.5 mr-1" /> Folder Filter:
        </span>
        {[
          { id: 'all', label: 'All Folders' },
          { id: 'general', label: 'General' },
          { id: 'schema', label: 'Schemas' },
          { id: 'reports', label: 'Reports' },
          { id: 'certificates', label: 'Certificates' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFolder(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              folder === f.id
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          Fetching documents from Supabase Storage...
        </div>
      ) : documents.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-8 space-y-2">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-700 text-sm">No documents found in selected folder</h4>
          <p className="text-xs text-slate-500">
            Upload your first document above to store it in the <code>documents</code> bucket.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h5 className="font-bold text-slate-900 text-xs truncate" title={doc.name}>
                      {doc.name}
                    </h5>
                    <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                      Path: {doc.path}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span>{formatBytes(doc.size)}</span>
                      {doc.created_at && (
                        <>
                          <span>•</span>
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(doc)}
                  title="Delete from bucket"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <a
                  href={doc.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="flex-1 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>

                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>

                <button
                  onClick={() => handleCopyUrl(doc.publicUrl, doc.path)}
                  title="Copy Public URL"
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  {copiedPath === doc.path ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h4 className="font-bold text-slate-900 text-sm truncate">{previewDoc.name}</h4>
              <button onClick={() => setPreviewDoc(null)} className="p-1 text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>

            <div className="bg-slate-100 rounded-2xl p-4 max-h-96 overflow-auto text-xs font-mono">
              {previewDoc.name.endsWith('.pdf') ? (
                <iframe src={previewDoc.publicUrl} className="w-full h-80 rounded-xl" title="PDF Preview" />
              ) : previewDoc.name.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                <img src={previewDoc.publicUrl} alt={previewDoc.name} className="max-h-80 mx-auto rounded-xl object-contain" />
              ) : (
                <div className="space-y-3 text-slate-700">
                  <p className="font-sans text-xs">Public URL link generated by Supabase Storage:</p>
                  <a href={previewDoc.publicUrl} target="_blank" rel="noreferrer" className="text-emerald-700 underline break-all font-mono">
                    {previewDoc.publicUrl}
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <a
                href={previewDoc.publicUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download File
              </a>
              <button onClick={() => setPreviewDoc(null)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
