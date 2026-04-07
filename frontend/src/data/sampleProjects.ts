// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

export interface FileSystemItem {
  type: 'file' | 'folder';
  name: string;
  content?: string;
  items?: FileSystemItem[];
}

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

const DEFAULT_CPP_MAIN = `#include <iostream>
#include <thread>
#include "greeting.h"

int main() {
    printWithTypingEffect(getGreeting(), 100);
    std::cout << std::endl;
    return 0;
}`

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
  {
    label: "C++ Multiples Files (Beta)",
    language: "cpp",
    description: "A minimal C++ multi-file hello world project",
    data: [
      {
        type: 'folder',
        name: 'cpp-project',
        items: [
          {
            type: 'file',
            name: 'CMakeLists.txt',
            content: 'cmake_minimum_required(VERSION 3.16)\nproject(cpp_project)\n\nset(CMAKE_CXX_STANDARD 17)\nset(CMAKE_CXX_STANDARD_REQUIRED ON)\n\nfind_package(Threads REQUIRED)\n\nadd_executable(main src/main.cpp src/greeting.cpp)\ntarget_include_directories(main PRIVATE include)\ntarget_link_libraries(main PRIVATE Threads::Threads)\n'
          },
          {
            type: 'file',
            name: 'README.md',
            content: '# C++ Project\n\nMinimal multi-file C++ hello world template.\n'
          },
          {
            type: 'folder',
            name: 'include',
            items: [
              {
                type: 'file',
                name: 'greeting.h',
                content: '#pragma once\n\n#include <chrono>\n\nconst char* getGreeting();\nvoid printWithTypingEffect(const char* text, int delay_ms = 100);\n'
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
                content: DEFAULT_CPP_MAIN
              },
              {
                type: 'file',
                name: 'greeting.cpp',
                content: '#include "greeting.h"\n#include <iostream>\n#include <thread>\n\nconst char* getGreeting() {\n    return "Hello, World from C++ multiples files!";\n}\n\nvoid printWithTypingEffect(const char* text, int delay_ms) {\n    for (const char* p = text; *p; ++p) {\n        std::cout << *p << std::flush;\n        std::this_thread::sleep_for(std::chrono::milliseconds(delay_ms));\n    }\n}\n'
              }
            ]
          }
        ]
      }
    ]
  }
];
