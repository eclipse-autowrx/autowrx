// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Stub - full code editor to be implemented later
import { FC } from 'react'

const PrototypeTabCode: FC = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-6 bg-background">
      <div className="text-center max-w-md">
        <h2 className="text-lg font-semibold text-primary mb-4">
          SDV Code Editor
        </h2>
        <p className="text-muted-foreground mb-4">
          The code editor with Monaco, GenAI integration, and Velocitas project
          creation will be implemented here.
        </p>
        <p className="text-sm text-muted-foreground">
          💡 Coming soon: Code editing, syntax highlighting, AI assistance, and
          deployment features
        </p>
      </div>
    </div>
  )
}

export default PrototypeTabCode
