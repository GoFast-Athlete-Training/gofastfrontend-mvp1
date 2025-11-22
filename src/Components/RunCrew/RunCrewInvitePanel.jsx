import React, { useState } from 'react';
import { generateUniversalInviteLink } from '../../utils/AuthDetectionService';
import { copyInviteLink } from '../../utils/InviteLinkGenerator';

/**
 * RunCrewInvitePanel - Reusable component for displaying and sharing RunCrew invite codes
 * 
 * Props:
 * - inviteCode: string (required) - The RunCrew invite code (e.g., runCrew.inviteCode)
 * - className: string (optional) - Additional CSS classes
 */
export default function RunCrewInvitePanel({ inviteCode, className = '' }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!inviteCode) {
    return (
      <div className={`border-t border-gray-200 pt-6 space-y-3 ${className}`}>
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Invite Teammates</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500">
          No invite code available
        </div>
      </div>
    );
  }

  const inviteUrl = generateUniversalInviteLink(inviteCode);

  const handleCopyLink = async () => {
    try {
      const success = await copyInviteLink(inviteUrl);
      if (success) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy invite link:', err);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };


  return (
    <div className={`border-t border-gray-200 pt-6 space-y-3 ${className}`}>
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Invite Teammates</p>
      
      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4 space-y-3">
        <code className="block text-xs text-gray-700 break-all bg-white px-3 py-2 rounded border border-gray-200">
          {inviteUrl}
        </code>
        <button
          onClick={handleCopyLink}
          className="w-full text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
        >
          {copiedLink ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Invite Link
            </>
          )}
        </button>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Or share code:</p>
          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-2 text-base font-bold text-emerald-600 hover:text-emerald-700 transition"
          >
            <code>{inviteCode}</code>
            {copiedCode ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

