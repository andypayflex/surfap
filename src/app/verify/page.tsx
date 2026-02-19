"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function VerifyContent() {
  const params = useSearchParams();
  const status = params.get("status");
  const userId = params.get("user");

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {status === "success" && (
          <>
            <div className="text-5xl mb-4">🤙</div>
            <h1 className="text-2xl font-bold text-cyan-300 mb-3">Email Verified!</h1>
            <p className="text-zinc-400 mb-6">
              You&apos;re all set. Now pick the surf breaks you want tracked.
            </p>
            <Link
              href={`/breaks?user=${userId}`}
              className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-blue-500 transition"
            >
              Choose Your Breaks
            </Link>
          </>
        )}
        {status === "already" && (
          <>
            <div className="text-5xl mb-4">👍</div>
            <h1 className="text-2xl font-bold text-zinc-200 mb-3">Already Verified</h1>
            <p className="text-zinc-400 mb-6">Your email is already verified.</p>
            <Link
              href={`/dashboard?user=${userId}`}
              className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg"
            >
              Go to Dashboard
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-5xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-red-400 mb-3">Verification Failed</h1>
            <p className="text-zinc-400 mb-6">
              Invalid or expired link. Please try signing up again.
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

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Verifying...</p>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
