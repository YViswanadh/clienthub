import React from 'react';

export default function PhaseTimeline({ phases = [] }) {
  if (!phases || phases.length === 0) return null;

  return (
    <div>
      <h3>Project Phases Timeline</h3>
      <ul>
        {phases.map((phase, idx) => (
          <li key={phase.name || idx}>
            {phase.done ? '[X]' : '[ ]'} {phase.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
