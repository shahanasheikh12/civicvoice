import React from 'react'
import IssueCard from './IssueCard'

export default function IssueGrid({ issues }) {
  if (!issues || issues.length === 0) return null

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '18px',
      }}
      className="issue-grid"
    >
      {issues.map(issue => (
        <IssueCard key={issue.id} issue={issue} voteCount={issue.voteCount} />
      ))}

      {/* Inline responsive CSS for the grid container */}
      <style>{`
        @media (max-width: 900px) { .issue-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 620px) { .issue-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
