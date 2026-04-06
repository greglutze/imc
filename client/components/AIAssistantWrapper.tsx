'use client';

import { usePathname } from 'next/navigation';
import AIAssistant from './AIAssistant';

/**
 * Wrapper that extracts projectId from the URL path
 * and passes it to the AI assistant. Renders on every page.
 */
export default function AIAssistantWrapper() {
  const pathname = usePathname();

  // Extract project ID from /projects/[id] routes
  const match = pathname?.match(/^\/projects\/([a-f0-9-]+)/);
  const projectId = match ? match[1] : undefined;

  return <AIAssistant projectId={projectId} />;
}
