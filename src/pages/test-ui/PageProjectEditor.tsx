// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react';
import { ProjectEditor } from '../../components/molecules/project_editor';
import { SAMPLE_PROJECTS, type SampleProject } from '../../data/sampleProjects';

const PageProjectEditor: React.FC = () => {
  // Default initial project data - C++ Project with enhanced file type support
  const defaultProjectData = JSON.stringify([
    {
      type: 'folder',
      name: 'cpp-project',
      items: [
        {
          type: 'file',
          name: 'README.md',
          content: '# C++ Project\n\nThis is a sample C++ project demonstrating the enhanced file type support.\n\n## Features\n\n- C++ source files (.cpp, .h, .hpp)\n- CMake build system\n- Multiple programming languages\n- Syntax highlighting for 100+ file types'
        },
        {
          type: 'file',
          name: 'CMakeLists.txt',
          content: 'cmake_minimum_required(VERSION 3.16)\nproject(cpp_project)\n\nset(CMAKE_CXX_STANDARD 17)\nset(CMAKE_CXX_STANDARD_REQUIRED ON)\n\nadd_executable(main src/main.cpp src/utils.cpp)\ntarget_include_directories(main PRIVATE include)\n\n# Find and link required libraries\nfind_package(Boost REQUIRED)\ntarget_link_libraries(main PRIVATE Boost::boost)\n\n# Set compiler flags\nif(MSVC)\n    target_compile_options(main PRIVATE /W4)\nelse()\n    target_compile_options(main PRIVATE -Wall -Wextra -Wpedantic)\nendif()'
        },
        {
          type: 'file',
          name: 'Makefile',
          content: 'CXX = g++\nCXXFLAGS = -std=c++17 -Wall -Wextra -O2\nINCLUDES = -Iinclude\nLIBS = -lboost_system -lboost_filesystem\n\nSRCDIR = src\nOBJDIR = obj\nBINDIR = bin\n\nSOURCES = $(wildcard $(SRCDIR)/*.cpp)\nOBJECTS = $(SOURCES:$(SRCDIR)/%.cpp=$(OBJDIR)/%.o)\nTARGET = $(BINDIR)/main\n\n$(TARGET): $(OBJECTS)\n\t@mkdir -p $(BINDIR)\n\t$(CXX) $(OBJECTS) -o $(TARGET) $(LIBS)\n\n$(OBJDIR)/%.o: $(SRCDIR)/%.cpp\n\t@mkdir -p $(OBJDIR)\n\t$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@\n\nclean:\n\trm -rf $(OBJDIR) $(BINDIR)\n\n.PHONY: clean'
        },
        {
          type: 'file',
          name: '.gitignore',
          content: '# Build artifacts\nbuild/\nobj/\nbin/\n*.o\n*.obj\n*.exe\n*.dll\n*.so\n*.dylib\n\n# CMake\nCMakeCache.txt\nCMakeFiles/\ncmake_install.cmake\nMakefile\n\n# IDE\n.vscode/\n.idea/\n*.swp\n*.swo\n*~\n\n# OS\n.DS_Store\nThumbs.db\n\n# Dependencies\nvcpkg_installed/\nconan/\n'
        },
        {
          type: 'folder',
          name: 'include',
          items: [
            {
              type: 'file',
              name: 'utils.h',
              content: '#pragma once\n\n#include <string>\n#include <vector>\n#include <memory>\n\nnamespace utils {\n\nclass StringProcessor {\npublic:\n    StringProcessor();\n    ~StringProcessor();\n    \n    std::string process(const std::string& input);\n    std::vector<std::string> split(const std::string& input, char delimiter);\n    \nprivate:\n    class Impl;\n    std::unique_ptr<Impl> pImpl;\n};\n\n// Utility functions\nstd::string toUpperCase(const std::string& str);\nstd::string toLowerCase(const std::string& str);\nbool startsWith(const std::string& str, const std::string& prefix);\nbool endsWith(const std::string& str, const std::string& suffix);\n\n} // namespace utils'
            },
            {
              type: 'file',
              name: 'config.h',
              content: '#pragma once\n\n#include <string>\n#include <map>\n\nnamespace config {\n\nstruct AppConfig {\n    std::string appName;\n    std::string version;\n    std::string dataPath;\n    bool debugMode;\n    int maxThreads;\n    \n    AppConfig();\n    bool loadFromFile(const std::string& filename);\n    bool saveToFile(const std::string& filename) const;\n};\n\nclass ConfigManager {\npublic:\n    static ConfigManager& getInstance();\n    \n    AppConfig& getConfig();\n    void reloadConfig();\n    \nprivate:\n    ConfigManager() = default;\n    ConfigManager(const ConfigManager&) = delete;\n    ConfigManager& operator=(const ConfigManager&) = delete;\n    \n    AppConfig config;\n};\n\n} // namespace config'
            }
          ]
        },
        {
          type: 'folder',
          name: 'src',
          items: [
            {
              type: 'file',
              name: 'main.cpp',
              content: '#include <iostream>\n#include <memory>\n#include "utils.h"\n#include "config.h"\n\nint main(int argc, char* argv[]) {\n    try {\n        std::cout << "C++ Project Starting..." << std::endl;\n        \n        // Initialize configuration\n        auto& configMgr = config::ConfigManager::getInstance();\n        auto& config = configMgr.getConfig();\n        \n        std::cout << "App: " << config.appName << std::endl;\n        std::cout << "Version: " << config.version << std::endl;\n        \n        // Process command line arguments\n        if (argc > 1) {\n            std::string input = argv[1];\n            utils::StringProcessor processor;\n            \n            std::string result = processor.process(input);\n            std::cout << "Processed: " << result << std::endl;\n            \n            auto parts = processor.split(result, \' \');\n            std::cout << "Split into " << parts.size() << " parts" << std::endl;\n        }\n        \n        std::cout << "Application completed successfully!" << std::endl;\n        return 0;\n        \n    } catch (const std::exception& e) {\n        std::cerr << "Error: " << e.what() << std::endl;\n        return 1;\n    }\n}'
            },
            {
              type: 'file',
              name: 'utils.cpp',
              content: '#include "utils.h"\n#include <algorithm>\n#include <sstream>\n#include <cctype>\n\nnamespace utils {\n\nclass StringProcessor::Impl {\npublic:\n    std::string process(const std::string& input) {\n        std::string result = input;\n        \n        // Remove extra whitespace\n        std::string::iterator new_end = std::unique(result.begin(), result.end(),\n            [](char a, char b) { return a == \' \' && b == \' \'; });\n        result.erase(new_end, result.end());\n        \n        // Trim leading/trailing whitespace\n        result.erase(0, result.find_first_not_of(" \\t\\n\\r"));\n        result.erase(result.find_last_not_of(" \\t\\n\\r") + 1);\n        \n        return result;\n    }\n    \n    std::vector<std::string> split(const std::string& input, char delimiter) {\n        std::vector<std::string> tokens;\n        std::stringstream ss(input);\n        std::string token;\n        \n        while (std::getline(ss, token, delimiter)) {\n            if (!token.empty()) {\n                tokens.push_back(token);\n            }\n        }\n        \n        return tokens;\n    }\n};\n\nStringProcessor::StringProcessor() : pImpl(std::make_unique<Impl>()) {}\nStringProcessor::~StringProcessor() = default;\n\nstd::string StringProcessor::process(const std::string& input) {\n    return pImpl->process(input);\n}\n\nstd::vector<std::string> StringProcessor::split(const std::string& input, char delimiter) {\n    return pImpl->split(input, delimiter);\n}\n\n// Utility function implementations\nstd::string toUpperCase(const std::string& str) {\n    std::string result = str;\n    std::transform(result.begin(), result.end(), result.begin(), ::toupper);\n    return result;\n}\n\nstd::string toLowerCase(const std::string& str) {\n    std::string result = str;\n    std::transform(result.begin(), result.end(), result.begin(), ::tolower);\n    return result;\n}\n\nbool startsWith(const std::string& str, const std::string& prefix) {\n    if (prefix.length() > str.length()) return false;\n    return str.compare(0, prefix.length(), prefix) == 0;\n}\n\nbool endsWith(const std::string& str, const std::string& suffix) {\n    if (suffix.length() > str.length()) return false;\n    return str.compare(str.length() - suffix.length(), suffix.length(), suffix) == 0;\n}\n\n} // namespace utils'
            },
            {
              type: 'file',
              name: 'config.cpp',
              content: '#include "config.h"\n#include <fstream>\n#include <iostream>\n#include <sstream>\n\nnamespace config {\n\nAppConfig::AppConfig() \n    : appName("C++ Project")\n    , version("1.0.0")\n    , dataPath("./data")\n    , debugMode(false)\n    , maxThreads(4) {\n}\n\nbool AppConfig::loadFromFile(const std::string& filename) {\n    std::ifstream file(filename);\n    if (!file.is_open()) {\n        std::cerr << "Failed to open config file: " << filename << std::endl;\n        return false;\n    }\n    \n    std::string line;\n    while (std::getline(file, line)) {\n        if (line.empty() || line[0] == \'#\') continue;\n        \n        size_t pos = line.find(\'=\');\n        if (pos == std::string::npos) continue;\n        \n        std::string key = line.substr(0, pos);\n        std::string value = line.substr(pos + 1);\n        \n        // Parse configuration values\n        if (key == "appName") appName = value;\n        else if (key == "version") version = value;\n        else if (key == "dataPath") dataPath = value;\n        else if (key == "debugMode") debugMode = (value == "true");\n        else if (key == "maxThreads") {\n            try {\n                maxThreads = std::stoi(value);\n            } catch (...) {\n                std::cerr << "Invalid maxThreads value: " << value << std::endl;\n            }\n        }\n    }\n    \n    return true;\n}\n\nbool AppConfig::saveToFile(const std::string& filename) const {\n    std::ofstream file(filename);\n    if (!file.is_open()) {\n        std::cerr << "Failed to create config file: " << filename << std::endl;\n        return false;\n    }\n    \n    file << "# Application Configuration\\n";\n    file << "appName=" << appName << "\\n";\n    file << "version=" << version << "\\n";\n    file << "dataPath=" << dataPath << "\\n";\n    file << "debugMode=" << (debugMode ? "true" : "false") << "\\n";\n    file << "maxThreads=" << maxThreads << "\\n";\n    \n    return true;\n}\n\nConfigManager& ConfigManager::getInstance() {\n    static ConfigManager instance;\n    return instance;\n}\n\nAppConfig& ConfigManager::getConfig() {\n    return config;\n}\n\nvoid ConfigManager::reloadConfig() {\n    config.loadFromFile("config.ini");\n}\n\n} // namespace config'
            }
          ]
        },
        {
          type: 'folder',
          name: 'tests',
          items: [
            {
              type: 'file',
              name: 'test_utils.cpp',
              content: '#include <cassert>\n#include <iostream>\n#include "utils.h"\n\nvoid testStringProcessor() {\n    utils::StringProcessor processor;\n    \n    // Test process function\n    std::string input = "  hello   world  ";\n    std::string result = processor.process(input);\n    assert(result == "hello world");\n    \n    // Test split function\n    auto parts = processor.split("a,b,c", \',\');\n    assert(parts.size() == 3);\n    assert(parts[0] == "a");\n    assert(parts[1] == "b");\n    assert(parts[2] == "c");\n    \n    std::cout << "StringProcessor tests passed!" << std::endl;\n}\n\nvoid testUtilityFunctions() {\n    // Test toUpperCase\n    assert(utils::toUpperCase("hello") == "HELLO");\n    \n    // Test toLowerCase\n    assert(utils::toLowerCase("WORLD") == "world");\n    \n    // Test startsWith\n    assert(utils::startsWith("hello world", "hello"));\n    assert(!utils::startsWith("hello world", "world"));\n    \n    // Test endsWith\n    assert(utils::endsWith("hello world", "world"));\n    assert(!utils::endsWith("hello world", "hello"));\n    \n    std::cout << "Utility function tests passed!" << std::endl;\n}\n\nint main() {\n    try {\n        testStringProcessor();\n        testUtilityFunctions();\n        \n        std::cout << "All tests passed!" << std::endl;\n        return 0;\n        \n    } catch (const std::exception& e) {\n        std::cerr << "Test failed: " << e.what() << std::endl;\n        return 1;\n    }\n}'
            }
          ]
        },
        {
          type: 'folder',
          name: 'docs',
          items: [
            {
              type: 'file',
              name: 'API.md',
              content: '# API Documentation\n\n## StringProcessor Class\n\n### Constructor\n```cpp\nStringProcessor()\n```\n\n### Methods\n- `std::string process(const std::string& input)` - Clean and normalize input string\n- `std::vector<std::string> split(const std::string& input, char delimiter)` - Split string by delimiter\n\n## Utility Functions\n\n- `toUpperCase(const std::string& str)` - Convert string to uppercase\n- `toLowerCase(const std::string& str)` - Convert string to lowercase\n- `startsWith(const std::string& str, const std::string& prefix)` - Check if string starts with prefix\n- `endsWith(const std::string& str, const std::string& suffix)` - Check if string ends with suffix\n\n## Configuration\n\n### AppConfig Structure\n```cpp\nstruct AppConfig {\n    std::string appName;\n    std::string version;\n    std::string dataPath;\n    bool debugMode;\n    int maxThreads;\n};\n```\n\n### ConfigManager\nSingleton class for managing application configuration.\n'
            },
            {
              type: 'file',
              name: 'BUILD.md',
              content: '# Build Instructions\n\n## Prerequisites\n- CMake 3.16+\n- C++17 compatible compiler (GCC 7+, Clang 5+, MSVC 2017+)\n- Boost libraries\n\n## Build with CMake\n```bash\nmkdir build && cd build\ncmake ..\nmake\n```\n\n## Build with Make\n```bash\nmake clean\nmake\n```\n\n## Running Tests\n```bash\ncd tests\nmake\ngcc -std=c++17 -I../include test_utils.cpp ../src/utils.cpp -o test_utils\n./test_utils\n```\n\n## Project Structure\n```\n├── include/          # Header files\n├── src/             # Source files\n├── tests/           # Test files\n├── docs/            # Documentation\n├── CMakeLists.txt   # CMake configuration\n└── Makefile         # Make build file\n```'
            }
          ]
        },
        {
          type: 'file',
          name: 'config.ini',
          content: '# Application Configuration\nappName=C++ Project\nversion=1.0.0\ndataPath=./data\ndebugMode=false\nmaxThreads=4'
        },
        {
          type: 'file',
          name: 'package.json',
          content: JSON.stringify({
            name: 'cpp-project',
            version: '1.0.0',
            description: 'A comprehensive C++ project with enhanced file type support',
            main: 'src/main.cpp',
            scripts: {
              build: 'mkdir -p build && cd build && cmake .. && make',
              test: 'cd tests && make && ./test_utils',
              clean: 'rm -rf build obj bin'
            },
            dependencies: {
              boost: '^1.80.0'
            },
            devDependencies: {
              cmake: '^3.16.0',
              gcc: '^7.0.0'
            }
          }, null, 2)
        }
      ]
    }
  ]);

  // Initialize state from localStorage or use default data
  const [projectData, setProjectData] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('project-editor-data');
      return saved || defaultProjectData;
    } catch (error) {
      console.warn('Failed to load from localStorage, using default data:', error);
      return defaultProjectData;
    }
  });

  // Save to localStorage whenever project data changes
  useEffect(() => {
    try {
      localStorage.setItem('project-editor-data', projectData);
      console.log('Project data saved to localStorage');
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [projectData]);

  const handleProjectChange = (newData: string) => {
    setProjectData(newData);
    console.log('Project data changed:', newData);
  };

  // Function to reset to default data
  const resetToDefault = () => {
    setProjectData(defaultProjectData);
    try {
      localStorage.removeItem('project-editor-data');
      console.log('Reset to default data and cleared localStorage');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  };

  // Function to clear localStorage
  const clearStorage = () => {
    try {
      localStorage.removeItem('project-editor-data');
      console.log('localStorage cleared');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  };

  // Function to load a sample project
  const loadSampleProject = (sampleProject: SampleProject) => {
    let projectData: string;
    
    if (typeof sampleProject.data === 'string') {
      // Single file project - convert to project format
      const projectFormat = [
        {
          type: 'folder',
          name: 'project',
          items: [
            {
              type: 'file',
              name: `main.${sampleProject.language === 'python' ? 'py' : sampleProject.language === 'rust' ? 'rs' : 'cpp'}`,
              content: sampleProject.data
            }
          ]
        }
      ];
      projectData = JSON.stringify(projectFormat);
    } else {
      // Multi-file project - use as is
      projectData = JSON.stringify(sampleProject.data);
    }
    
    setProjectData(projectData);
    try {
      localStorage.setItem('project-editor-data', projectData);
      console.log(`Loaded sample project: ${sampleProject.label}`);
    } catch (error) {
      console.error('Failed to save sample project to localStorage:', error);
    }
  };

  return (
    <div className="h-screen">
      <div className="bg-gray-800 text-white p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Project Editor Demo</h1>
            <p className="text-gray-300">A full-featured code editor with enhanced file type support</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={resetToDefault}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
              title="Reset to default C++ project data"
            >
              Reset to Default
            </button>
            <button
              onClick={clearStorage}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
              title="Clear localStorage"
            >
              Clear Storage
            </button>
          </div>
        </div>
        
        {/* Sample Project Selector */}
        <div className="mt-4 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">Load Sample Projects</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SAMPLE_PROJECTS.map((sampleProject) => (
              <button
                key={sampleProject.language}
                onClick={() => loadSampleProject(sampleProject)}
                className="p-3 bg-gray-600 hover:bg-gray-500 rounded text-left transition-colors"
                title={sampleProject.description}
              >
                <div className="text-sm font-medium text-white">{sampleProject.label}</div>
                <div className="text-xs text-gray-300 mt-1">{sampleProject.language}</div>
                <div className="text-xs text-gray-400 mt-1 line-clamp-2">{sampleProject.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="h-full">
        <ProjectEditor 
          data={projectData} 
          onChange={handleProjectChange} 
        />
      </div>
    </div>
  );
};

export default PageProjectEditor;
