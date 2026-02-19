"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function UnsubscribeContent() {
  const params = useSearchParams();
  const status = params.get("status");

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {status === "success" ? (
          <>
            <div className="text-5xl mb-4">👋</div>
            <h1 className="text-2xl font-bold text-zinc-200 mb-3">Unsubscribed</h1>
            <p className="text-zinc-400 mb-6">
              You won&apos;t receive any more daily surf reports. You can always sign up again if you change your mind.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-zinc-800 text-zinc-200 font-semibold rounded-lg hover:bg-zinc-700 transition"
            >
              Back to Home
            </Link>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-red-400 mb-3">Something Went Wrong</h1>
            <p className="text-zinc-400 mb-6">
              We couldn&apos;t process your unsubscribe request. The link may be invalid.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-zinc-800 text-zinc-200 font-semibold rounded-lg hover:bg-zinc-700 transition"
            >
              Back to Home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Processing...</p>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
