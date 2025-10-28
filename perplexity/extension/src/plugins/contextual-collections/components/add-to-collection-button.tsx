import React, { useState, useRef, useEffect } from 'react';
import { collectionsManager } from '../services/collections-manager';
import type { Collection } from '../types';

interface AddToCollectionButtonProps {
  threadUrl: string;
  threadTitle: string;
  threadContent: string;
  className?: string;
}

export const AddToCollectionButton: React.FC<AddToCollectionButtonProps> = ({
  threadUrl,
  threadTitle,
  threadContent,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCollections(collectionsManager.getAllCollections());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setNewCollectionName('');
        setMessage('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddToCollection = async (collectionId: string) => {
    setIsAdding(collectionId);
    try {
      const success = await collectionsManager.addThreadToCollection(
        collectionId,
        threadUrl,
        threadTitle,
        threadContent
      );
      
      if (success) {
        setMessage('✓ Added to collection');
        setTimeout(() => {
          setIsOpen(false);
          setMessage('');
        }, 1500);
      } else {
        setMessage('Already in this collection');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (error) {
      console.error('Failed to add to collection:', error);
      setMessage('Failed to add to collection');
      setTimeout(() => setMessage(''), 2000);
    } finally {
      setIsAdding(null);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    
    try {
      const collection = await collectionsManager.createCollection(newCollectionName.trim());
      await handleAddToCollection(collection.id);
      setNewCollectionName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create collection:', error);
      setMessage('Failed to create collection');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateCollection();
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        title="Add to Collection"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        Add to Collection
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Add to Collection
            </h3>
            
            {message && (
              <div className={`mb-3 p-2 rounded text-sm ${
                message.startsWith('✓') 
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            {/* Existing Collections */}
            {collections.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Existing Collections ({collections.length})
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {collections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => handleAddToCollection(collection.id)}
                      disabled={isAdding === collection.id}
                      className="w-full text-left p-2 rounded border border-gray-100 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm text-gray-900">
                            {collection.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {collection.threads.length} threads
                          </div>
                        </div>
                        {isAdding === collection.id && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Collection */}
            <div className="border-t border-gray-100 pt-3">
              {!isCreating ? (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full p-2 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  + Create New Collection
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Collection name..."
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateCollection}
                      disabled={!newCollectionName.trim()}
                      className="flex-1 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Create & Add
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setNewCollectionName('');
                      }}
                      className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};