import React from 'react';
import { Check } from 'lucide-react';

export default function PhaseTimeline({ phases = [], compact = false }) {
  if (!phases || phases.length === 0) return null;

  // Determine active index: the first index where done is false
  const activeIndex = phases.findIndex((p) => !p.done);

  return (
    <div className={`w-full flex items-center justify-between ${compact ? 'py-2' : 'py-6'}`}>
      <div className="w-full flex items-center">
        {phases.map((phase, idx) => {
          const isDone = phase.done;
          const isActive = idx === activeIndex;
          const isPending = !isDone && !isActive;

          // Determine line colors
          // A line connects from the current step to the NEXT step
          const hasNext = idx < phases.length - 1;
          const nextIsDone = hasNext && phases[idx + 1].done;
          const lineIsPurple = isDone && (nextIsDone || idx === activeIndex - 1);

          return (
            <React.Fragment key={phase.name || idx}>
              {/* Step Circle & Label */}
              <div className="flex flex-col items-center relative z-10">
                {/* Circle */}
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isDone
                      ? 'bg-primary border-primary text-white shadow-sm'
                      : isActive
                      ? 'bg-primary border-primary text-white shadow-sm ring-4 ring-primary-light'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {isDone ? (
                    <Check className="h-4.5 w-4.5 stroke-[3]" />
                  ) : isActive ? (
                    <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  ) : (
                    <span className="text-xs font-semibold">{idx + 1}</span>
                  )}
                </div>

                {/* Label text */}
                {!compact && (
                  <span
                    className={`absolute top-10 whitespace-nowrap text-xs font-medium transition-all duration-300 ${
                      isDone
                        ? 'text-primary font-semibold'
                        : isActive
                        ? 'text-primary font-bold'
                        : 'text-[#6B7280]'
                    }`}
                  >
                    {phase.name}
                  </span>
                )}
              </div>

              {/* Connecting Line */}
              {hasNext && (
                <div className="flex-1 h-0.5 relative mx-2">
                  <div
                    className={`absolute inset-0 transition-all duration-500 ${
                      lineIsPurple ? 'bg-primary' : 'bg-gray-200'
                    }`}
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
