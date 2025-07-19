
"use client";

import { Suspense } from 'react';
import SharePageContent from '@/components/SharePageContent';

export default function SharePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <SharePageContent />
        </Suspense>
    )
}
