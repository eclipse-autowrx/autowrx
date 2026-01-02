// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { VscFolder, VscGoToFile, VscNewFile } from 'react-icons/vsc'

const Introduction = ({
  onCreateFile,
  onCreateFolder,
  onSelectFirstFile,
}: {
  onCreateFile?: () => void
  onCreateFolder?: () => void
  onSelectFirstFile?: () => void
}) => {
  return (
    <div className="p-10 text-gray-800 text-center h-full flex flex-col justify-center items-center bg-white">
      <h1 className="m-0 text-4xl font-light text-gray-900 mb-4">
        Code Editor
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Select a file to start editing.
      </p>
      <div className="text-left max-w-md w-full">
        <h3 className="border-b border-gray-300 pb-3 mb-6 text-gray-700 font-medium">
          Get Started
        </h3>
        <ul className="list-none p-0 space-y-1">
          <li
            className="text-sm flex items-center text-gray-600 hover:text-gray-800 transition-colors cursor-pointer hover:bg-gray-50 p-2 rounded"
            onClick={onSelectFirstFile}
          >
            <VscGoToFile className="mr-3 text-lg text-blue-600 shrink-0" />
            Choose a file from the explorer
          </li>
          <li
            className="text-sm flex items-center text-gray-600 hover:text-gray-800 transition-colors cursor-pointer hover:bg-gray-50 p-2 rounded"
            onClick={onCreateFile}
          >
            <VscNewFile className="mr-3 text-lg text-blue-600 shrink-0" />
            Create a new file
          </li>
          <li
            className="text-sm flex items-center text-gray-600 hover:text-gray-800 transition-colors cursor-pointer hover:bg-gray-50 p-2 rounded"
            onClick={onCreateFolder}
          >
            <VscFolder className="mr-3 text-lg text-blue-600 shrink-0" />
            Create a new folder
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Introduction
