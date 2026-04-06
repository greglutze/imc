'use client';

/**
 * NextStepBanner — a subtle, persistent wayfinding cue.
 *
 * Renders at the end of an instrument page to tell the user
 * what they just accomplished and where to go next.
 *
 * Design: light bg strip, check icon, concise text, pill CTA.
 */

interface NextStepAction {
  label: string;
  href: string;
}

interface Props {
  /** What the user just accomplished, e.g. "Research complete" */
  completedLabel: string;
  /** Primary next action */
  primary: NextStepAction;
  /** Optional secondary action */
  secondary?: NextStepAction;
}

export default function NextStepBanner({ completedLabel, primary, secondary }: Props) {
  return (
    <div className="border-t border-[#E8E8E8] bg-[#FAFAF8] px-10 py-5">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Check icon */}
          <div className="w-5 h-5 rounded-full bg-[#1A1A1A] flex items-center justify-center shrink-0">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5L4.5 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-[13px] font-medium text-[#1A1A1A]">
            {completedLabel}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {secondary && (
            <a
              href={secondary.href}
              className="text-[12px] text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors duration-150"
            >
              {secondary.label}
            </a>
          )}
          <a
            href={primary.href}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white bg-[#1A1A1A] px-4 py-2 rounded-full hover:bg-black transition-colors duration-150"
          >
            {primary.label}
            <span className="text-white/60">&rarr;</span>
          </a>
        </div>
      </div>
    </div>
  );
}
