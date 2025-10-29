// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FileSystemItem } from '../components/molecules/project_editor/types';

export interface SampleProject {
  label: string;
  data: FileSystemItem[] | string;
  language: string;
  description: string;
}

const DEFAULT_PYTHON_APP = `import time
import asyncio
import signal

from sdv.vdb.reply import DataPointReply
from sdv.vehicle_app import VehicleApp
from vehicle import Vehicle, vehicle

class TestApp(VehicleApp):

    def __init__(self, vehicle_client: Vehicle):
        super().__init__()
        self.Vehicle = vehicle_client

    async def on_start(self):
        # on app started, this function will be trigger, your logic SHOULD start from HERE
        while True:
            # sleep for 2 second
            await asyncio.sleep(2)
            # write an actuator signal with value
            await self.Vehicle.Body.Lights.Beam.Low.IsOn.set(True)
            await asyncio.sleep(1)
            # read an actuator back
            value = (await self.Vehicle.Body.Lights.Beam.Low.IsOn.get()).value
            print("Light value ", value)
            
            await asyncio.sleep(2)
            # write an actuator signal with value
            await self.Vehicle.Body.Lights.Beam.Low.IsOn.set(False)
            await asyncio.sleep(1)
            # read an actuator back
            value = (await self.Vehicle.Body.Lights.Beam.Low.IsOn.get()).value
            print("Light value ", value)

async def main():
    vehicle_app = TestApp(vehicle)
    await vehicle_app.run()


LOOP = asyncio.get_event_loop()
LOOP.add_signal_handler(signal.SIGTERM, LOOP.stop)
LOOP.run_until_complete(main())
LOOP.close()`

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    label: "Python Single File",
    language: "python",
    description: "Python single file",
    data: DEFAULT_PYTHON_APP,
  },
  {
    label: "Python Multiple Files (Beta)",
    language: "python",
    description: "A simple Python project with multiple files demonstrating basic structure",
    data: [
      {
        type: 'folder',
        name: 'python-project',
        items: [
          {
            type: 'file',
            name: 'README.md',
            content: '# Python Project\n\nA simple Python project with multiple files.\n\n## Features\n- Multiple Python modules\n- Configuration file\n- Requirements file\n- Basic project structure'
          },
          {
            type: 'file',
            name: 'requirements.txt',
            content: 'requests==2.31.0'
          },
          {
            type: 'file',
            name: 'main.py',
            content: DEFAULT_PYTHON_APP
          }
        ]
      }
    ]
  },
  {
    label: "Rust Multiple Files (Beta)",
    language: "rust",
    description: "A Rust project with multiple modules and proper Cargo structure",
    data: [
      {
        type: 'folder',
        name: 'rust-project',
        items: [
          {
            type: 'file',
            name: 'Cargo.toml',
            content: '[package]\nname = "rust-project"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\nserde = { version = "1.0", features = ["derive"] }\nserde_json = "1.0"\ntokio = { version = "1.0", features = ["full"] }\nreqwest = { version = "0.11", features = ["json"] }\n\n[dev-dependencies]\nassert2 = "0.3"\n'
          },
          {
            type: 'file',
            name: 'README.md',
            content: '# Rust Project\n\nA Rust project with multiple modules and proper structure.\n\n## Features\n- Multiple Rust modules\n- Async/await support\n- JSON serialization\n- Unit tests\n\n## Build\n```bash\ncargo build\ncargo test\ncargo run\n```'
          },
          {
            type: 'folder',
            name: 'src',
            items: [
              {
                type: 'file',
                name: 'main.rs',
                content: 'use crate::config::Config;\nuse crate::utils::format_message;\nuse crate::calculator::Calculator;\n\nmod config;\nmod utils;\nmod calculator;\n\n#[tokio::main]\nasync fn main() {\n    let config = Config::new();\n    println!("Starting Rust application with config: {:?}", config);\n    \n    let calc = Calculator::new();\n    let result = calc.add(10.0, 20.0);\n    let message = format_message(&format!("10 + 20 = {}", result));\n    println!("{}", message);\n}'
              },
              {
                type: 'file',
                name: 'config.rs',
                content: 'use serde::{Deserialize, Serialize};\nuse std::env;\n\n#[derive(Debug, Clone, Serialize, Deserialize)]\npub struct Config {\n    pub debug: bool,\n    pub api_url: String,\n    pub timeout: u64,\n}\n\nimpl Config {\n    pub fn new() -> Self {\n        Self {\n            debug: env::var("DEBUG").unwrap_or_else(|_| "false".to_string()).parse().unwrap_or(false),\n            api_url: env::var("API_URL").unwrap_or_else(|_| "http://localhost:8000".to_string()),\n            timeout: env::var("TIMEOUT").unwrap_or_else(|_| "30".to_string()).parse().unwrap_or(30),\n        }\n    }\n}'
              },
              {
                type: 'file',
                name: 'utils.rs',
                content: '/// Utility functions for the project.\npub fn format_message(message: &str) -> String {\n    format!("[INFO] {}", message)\n}\n\npub fn validate_input<T>(value: &Option<T>) -> bool {\n    value.is_some()\n}\n\npub fn safe_divide(a: f64, b: f64) -> Result<f64, String> {\n    if b == 0.0 {\n        return Err("Cannot divide by zero".to_string());\n    }\n    Ok(a / b)\n}'
              },
              {
                type: 'file',
                name: 'calculator.rs',
                content: '/// Simple calculator with arithmetic operations.\npub struct Calculator;\n\nimpl Calculator {\n    pub fn new() -> Self {\n        Self\n    }\n    \n    pub fn add(&self, a: f64, b: f64) -> f64 {\n        a + b\n    }\n    \n    pub fn subtract(&self, a: f64, b: f64) -> f64 {\n        a - b\n    }\n    \n    pub fn multiply(&self, a: f64, b: f64) -> f64 {\n        a * b\n    }\n    \n    pub fn divide(&self, a: f64, b: f64) -> Result<f64, String> {\n        if b == 0.0 {\n            return Err("Cannot divide by zero".to_string());\n        }\n        Ok(a / b)\n    }\n}'
              }
            ]
          },
          {
            type: 'folder',
            name: 'tests',
            items: [
              {
                type: 'file',
                name: 'integration_tests.rs',
                content: 'use rust_project::{Calculator, format_message, safe_divide};\n\n#[test]\nfn test_calculator_add() {\n    let calc = Calculator::new();\n    assert_eq!(calc.add(2.0, 3.0), 5.0);\n}\n\n#[test]\nfn test_calculator_multiply() {\n    let calc = Calculator::new();\n    assert_eq!(calc.multiply(4.0, 5.0), 20.0);\n}\n\n#[test]\nfn test_safe_divide() {\n    assert_eq!(safe_divide(10.0, 2.0).unwrap(), 5.0);\n}\n\n#[test]\nfn test_safe_divide_by_zero() {\n    assert!(safe_divide(10.0, 0.0).is_err());\n}'
              }
            ]
          }
        ]
      }
    ]
  },
  // {
  //   label: "C++ Multiple Files",
  //   language: "cpp",
  //   description: "A C++ project with headers, source files, and CMake build system",
  //   data: [
  //     {
  //       type: 'folder',
  //       name: 'cpp-project',
  //       items: [
  //         {
  //           type: 'file',
  //           name: 'CMakeLists.txt',
  //           content: 'cmake_minimum_required(VERSION 3.16)\nproject(cpp_project)\n\nset(CMAKE_CXX_STANDARD 17)\nset(CMAKE_CXX_STANDARD_REQUIRED ON)\n\nadd_executable(main src/main.cpp src/utils.cpp src/calculator.cpp)\ntarget_include_directories(main PRIVATE include)\n\n# Set compiler flags\nif(MSVC)\n    target_compile_options(main PRIVATE /W4)\nelse()\n    target_compile_options(main PRIVATE -Wall -Wextra -Wpedantic)\nendif()'
  //         },
  //         {
  //           type: 'file',
  //           name: 'README.md',
  //           content: '# C++ Project\n\nA C++ project with multiple files and CMake build system.\n\n## Features\n- Header files (.h)\n- Source files (.cpp)\n- CMake build system\n- Modern C++17 features\n\n## Build\n```bash\nmkdir build && cd build\ncmake ..\nmake\n```'
  //         },
  //         {
  //           type: 'folder',
  //           name: 'include',
  //           items: [
  //             {
  //               type: 'file',
  //               name: 'utils.h',
  //               content: '#pragma once\n\n#include <string>\n#include <vector>\n\nnamespace utils {\n\nclass StringProcessor {\npublic:\n    StringProcessor();\n    ~StringProcessor();\n    \n    std::string process(const std::string& input);\n    std::vector<std::string> split(const std::string& input, char delimiter);\n};\n\n// Utility functions\nstd::string toUpperCase(const std::string& str);\nstd::string toLowerCase(const std::string& str);\nbool startsWith(const std::string& str, const std::string& prefix);\nbool endsWith(const std::string& str, const std::string& suffix);\n\n} // namespace utils'
  //             },
  //             {
  //               type: 'file',
  //               name: 'calculator.h',
  //               content: '#pragma once\n\n#include <string>\n\nclass Calculator {\npublic:\n    Calculator();\n    ~Calculator();\n    \n    double add(double a, double b);\n    double subtract(double a, double b);\n    double multiply(double a, double b);\n    double divide(double a, double b);\n    \nprivate:\n    std::string lastOperation;\n};'
  //             }
  //           ]
  //         },
  //         {
  //           type: 'folder',
  //           name: 'src',
  //           items: [
  //             {
  //               type: 'file',
  //               name: 'main.cpp',
  //               content: '#include <iostream>\n#include <memory>\n#include "utils.h"\n#include "calculator.h"\n\nint main(int argc, char* argv[]) {\n    try {\n        std::cout << "C++ Project Starting..." << std::endl;\n        \n        utils::StringProcessor processor;\n        Calculator calc;\n        \n        // Process command line arguments\n        if (argc > 1) {\n            std::string input = argv[1];\n            std::string result = processor.process(input);\n            std::cout << "Processed: " << result << std::endl;\n            \n            auto parts = processor.split(result, \' \');\n            std::cout << "Split into " << parts.size() << " parts" << std::endl;\n        }\n        \n        // Test calculator\n        double result = calc.add(10.0, 20.0);\n        std::cout << "10 + 20 = " << result << std::endl;\n        \n        std::cout << "Application completed successfully!" << std::endl;\n        return 0;\n        \n    } catch (const std::exception& e) {\n        std::cerr << "Error: " << e.what() << std::endl;\n        return 1;\n    }\n}'
  //             },
  //             {
  //               type: 'file',
  //               name: 'utils.cpp',
  //               content: '#include "utils.h"\n#include <algorithm>\n#include <sstream>\n#include <cctype>\n\nnamespace utils {\n\nStringProcessor::StringProcessor() {}\nStringProcessor::~StringProcessor() {}\n\nstd::string StringProcessor::process(const std::string& input) {\n    std::string result = input;\n    \n    // Remove extra whitespace\n    std::string::iterator new_end = std::unique(result.begin(), result.end(),\n        [](char a, char b) { return a == \' \' && b == \' \'; });\n    result.erase(new_end, result.end());\n    \n    // Trim leading/trailing whitespace\n    result.erase(0, result.find_first_not_of(" \\t\\n\\r"));\n    result.erase(result.find_last_not_of(" \\t\\n\\r") + 1);\n    \n    return result;\n}\n\nstd::vector<std::string> StringProcessor::split(const std::string& input, char delimiter) {\n    std::vector<std::string> tokens;\n    std::stringstream ss(input);\n    std::string token;\n    \n    while (std::getline(ss, token, delimiter)) {\n        if (!token.empty()) {\n            tokens.push_back(token);\n        }\n    }\n    \n    return tokens;\n}\n\nstd::string toUpperCase(const std::string& str) {\n    std::string result = str;\n    std::transform(result.begin(), result.end(), result.begin(), ::toupper);\n    return result;\n}\n\nstd::string toLowerCase(const std::string& str) {\n    std::string result = str;\n    std::transform(result.begin(), result.end(), result.begin(), ::tolower);\n    return result;\n}\n\nbool startsWith(const std::string& str, const std::string& prefix) {\n    if (prefix.length() > str.length()) return false;\n    return str.compare(0, prefix.length(), prefix) == 0;\n}\n\nbool endsWith(const std::string& str, const std::string& suffix) {\n    if (suffix.length() > str.length()) return false;\n    return str.compare(str.length() - suffix.length(), suffix.length(), suffix) == 0;\n}\n\n} // namespace utils'
  //             },
  //             {
  //               type: 'file',
  //               name: 'calculator.cpp',
  //               content: '#include "calculator.h"\n#include <stdexcept>\n\nCalculator::Calculator() : lastOperation("") {}\nCalculator::~Calculator() {}\n\ndouble Calculator::add(double a, double b) {\n    lastOperation = "add";\n    return a + b;\n}\n\ndouble Calculator::subtract(double a, double b) {\n    lastOperation = "subtract";\n    return a - b;\n}\n\ndouble Calculator::multiply(double a, double b) {\n    lastOperation = "multiply";\n    return a * b;\n}\n\ndouble Calculator::divide(double a, double b) {\n    if (b == 0.0) {\n        throw std::invalid_argument("Cannot divide by zero");\n    }\n    lastOperation = "divide";\n    return a / b;\n}'
  //             }
  //           ]
  //         }
  //       ]
  //     }
  //   ]
  // }
];
