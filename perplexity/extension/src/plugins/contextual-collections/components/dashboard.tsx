import React, { useEffect, useState } from 'react';
import { collectionsManager } from '../services/collections-manager';
import type { Collection } from '../types';

export default function CollectionsDashboard() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [newName, setNewName] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');

  const refresh = () => setCollections(collectionsManager.getAllCollections());

  useEffect(() => {
    refresh();
    const active = collectionsManager.getActiveCollection();
    if (active) setActiveId(active.id);
  }, []);

  const create = async () => {
    if (!newName.trim()) return;
    await collectionsManager.createCollection(newName.trim());
    setNewName('');
    refresh();
  };

  const remove = async (id: string) => {
    await collectionsManager.deleteCollection(id);
    if (activeId === id) setActiveId(undefined);
    refresh();
  };

  const synthesize = async (id: string) => {
    setStatus('Synthesizing...');
    const res = await collectionsManager.synthesizeCollectionContext(id);
    setStatus(res ? '✓ Synthesized' : 'Failed to synthesize');
    setTimeout(() => setStatus(''), 2000);
    refresh();
  };

  const launchQuery = (collection: Collection) => {
    const ctx = collection.synthesizedContext || '';
    const final = ctx ? `${ctx}\n\n${query}` : query;
    if (!final.trim()) return;
    // Open Perplexity with prefilled query
    const q = encodeURIComponent(final);
    window.open(`https://www.perplexity.ai/?q=${q}`, '_blank');
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Contextual Collections</h2>
        <div className="text-sm text-gray-500">{status}</div>
      </div>

      <div className="mb-6 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New collection name..."
          className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={create}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {collections.map((c) => (
          <div key={c.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-gray-500">{c.threads.length} threads</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => synthesize(c.id)}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Synthesize
                </button>
                <button
                  onClick={() => remove(c.id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>

            {c.synthesizedContext && (
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                {c.synthesizedContext}
              </pre>
            )}

            <div className="mt-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question using this collection's context..."
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-2 text-right">
                <button
                  onClick={() => launchQuery(c)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Launch in Perplexity
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {collections.length === 0 && (
        <div className="text-sm text-gray-500">
          No collections yet. Create one above and use the "Add to Collection" button on a thread to populate it.
        </div>
      )}
    </div>
  );
}
