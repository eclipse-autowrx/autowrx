// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Stub - full discussion system to be implemented later
interface DaDiscussionsProps {
  refId: string
  refType: string
  className?: string
}

const DaDiscussions = ({ refId, refType, className }: DaDiscussionsProps) => {
  return (
    <div className={`flex flex-col p-6 ${className}`}>
      <h3 className="text-xl font-semibold text-primary mb-4">Discussions</h3>
      <p className="text-muted-foreground">
        Discussion system coming soon (ref: {refId}, type: {refType})
      </p>
    </div>
  )
}

export default DaDiscussions
