/**
 * Content Script: Perplexity DOM integration for Contextual Collections
 * - Locates thread container and mounts an AddToCollectionButton next to the title
 */

import { AddToCollectionButton } from '@/plugins/contextual-collections/components/add-to-collection-button';
import { createRoot } from 'react-dom/client';
import React from 'react';

function waitForElement(selector: string, timeout = 15000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);

    const obs = new MutationObserver(() => {
      const node = document.querySelector(selector);
      if (node) {
        obs.disconnect();
        resolve(node);
      }
    });

    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => {
      obs.disconnect();
      reject(new Error(`Timeout waiting for ${selector}`));
    }, timeout);
  });
}

function getThreadData(): { title: string; url: string; content: string } | null {
  const titleEl = document.querySelector('h1, h2');
  const contentEl = document.querySelector('[data-thread-root]') || document.body;
  if (!titleEl) return null;

  const title = (titleEl.textContent || '').trim();
  const url = location.href;
  const content = (contentEl.textContent || '').slice(0, 100000);
  return { title, url, content };
}

async function mountButton() {
  try {
    const host = await waitForElement('header, h1, h2');

    // Avoid duplicate mounts
    if (document.getElementById('cplx-add-to-collection')) return;

    const mount = document.createElement('span');
    mount.id = 'cplx-add-to-collection';
    mount.style.marginLeft = '8px';
    host.appendChild(mount);

    const data = getThreadData();
    if (!data) return;

    const root = createRoot(mount);
    root.render(
      <AddToCollectionButton
        threadUrl={data.url}
        threadTitle={data.title}
        threadContent={data.content}
      />
    );

    console.log('[ContextualCollections] Button mounted');
  } catch (e) {
    console.warn('[ContextualCollections] Failed to mount:', e);
  }
}

// Kickoff after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountButton, { once: true });
} else {
  void mountButton();
}
