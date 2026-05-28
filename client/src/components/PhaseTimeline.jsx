import React from 'react';
import { Check } from 'lucide-react';

export default function PhaseTimeline({ phases = [], compact = false }) {
  if (!phases || phases.length === 0) return null;

  // Determine active index: the first index where done is false
  const activeIndex = phases.findIndex((p) => !p.done);

  return (
    <div className="w-full flex items-center justify-between py-2 overflow-x-auto">
      {/* Pulse Keyframe inject */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(91, 78, 245, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(91, 78, 245, 0); }
        }
        .step-pulse-active {
          animation: pulse 1.6s infinite ease-in-out;
        }
      `}</style>

      <div className="w-full flex items-center min-w-max px-2">
        {phases.map((phase, idx) => {
          const isDone = phase.done;
          const isActive = idx === activeIndex;
          const isPending = !isDone && !isActive;

          const hasNext = idx < phases.length - 1;
          // Connecting line is colored var(--electric) if current step is done and next is done or active
          const lineIsActive = isDone;

          return (
            <React.Fragment key={phase.name || idx}>
              {/* Step Circle and Label container */}
              <div className="flex flex-col items-center relative z-10 shrink-0">
                {/* Circle */}
                <div
                  className={`flex items-center justify-center rounded-full transition-all duration-200 ${
                    compact ? 'h-4 w-4' : 'h-[22px] w-[22px]'
                  } ${isActive ? 'step-pulse-active' : ''}`}
                  style={{
                    backgroundColor: isDone || isActive ? 'var(--brand-color, var(--electric))' : '#ffffff',
                    border: isPending ? '2px solid var(--border)' : 'none',
                  }}
                >
                  {isDone ? (
                    <Check className={compact ? 'h-2.5 w-2.5 text-white' : 'h-3 w-3 text-white'} style={{ strokeWidth: 3 }} />
                  ) : isActive ? (
                    <div
                      className="rounded-full bg-white shrink-0"
                      style={{
                        width: compact ? '4px' : '6px',
                        height: compact ? '4px' : '6px',
                      }}
                    />
                  ) : (
                    <div
                      className="rounded-full bg-slate-300 shrink-0"
                      style={{
                        width: compact ? '3px' : '4px',
                        height: compact ? '3px' : '4px',
                      }}
                    />
                  )}
                </div>

                {/* Step label text below */}
                {!compact && (
                  <span
                    className="absolute top-[30px] whitespace-nowrap text-[11px]"
                    style={{
                      fontWeight: isDone || isActive ? '500' : '400',
                      color: isDone || isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                  >
                    {phase.name}
                  </span>
                )}
              </div>

              {/* Connecting line segment */}
              {hasNext && (
                <div className="flex-1 mx-2 relative" style={{ height: '2px', minWidth: compact ? '20px' : '40px' }}>
                  <div
                    className="absolute inset-0 transition-all duration-300"
                    style={{
                      backgroundColor: lineIsActive ? 'var(--brand-color, var(--electric))' : 'var(--border)',
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
