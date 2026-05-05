// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

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
LOOP.close()`;

const PYTHON_MULTI_FILES = [
  {
    type: 'folder',
    name: 'python-project',
    items: [
      {
        type: 'file',
        name: 'README.md',
        content:
          '# Python Project\n\nA simple Python project with multiple files.\n\n## Features\n- Multiple Python modules\n- Configuration file\n- Requirements file\n- Basic project structure',
      },
      { type: 'file', name: 'requirements.txt', content: 'requests==2.31.0' },
      { type: 'file', name: 'main.py', content: DEFAULT_PYTHON_APP },
    ],
  },
];

const RUST_MULTI_FILES = [
  {
    type: 'folder',
    name: 'rust-project',
    items: [
      {
        type: 'file',
        name: 'Cargo.toml',
        content:
          '[package]\nname = "rust_project"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\n',
      },
      {
        type: 'file',
        name: 'README.md',
        content:
          '# Rust Project\n\nMinimal multi-file Rust hello world template.\n',
      },
      {
        type: 'folder',
        name: 'src',
        items: [
          {
            type: 'file',
            name: 'main.rs',
            content:
              'mod greeting;\n\nfn main() {\n    greeting::print_with_typing_effect(greeting::get_greeting(), 100);\n    println!();\n}\n',
          },
          {
            type: 'file',
            name: 'greeting.rs',
            content:
              'use std::{thread, time::Duration};\n\npub fn get_greeting() -> &\'static str {\n    "Hello, World from Rust multiple files!"\n}\n\npub fn print_with_typing_effect(text: &str, delay_ms: u64) {\n    for ch in text.chars() {\n        print!("{ch}");\n        let _ = std::io::Write::flush(&mut std::io::stdout());\n        thread::sleep(Duration::from_millis(delay_ms));\n    }\n}\n',
          },
        ],
      },
    ],
  },
];

const DEFAULT_CPP_MAIN = `#include <iostream>
#include <thread>
#include "greeting.h"

int main() {
    printWithTypingEffect(getGreeting(), 100);
    std::cout << std::endl;
    return 0;
}`;

const CPP_MULTI_FILES = [
  {
    type: 'folder',
    name: 'cpp-project',
    items: [
      {
        type: 'file',
        name: 'CMakeLists.txt',
        content:
          'cmake_minimum_required(VERSION 3.16)\nproject(cpp_project)\n\nset(CMAKE_CXX_STANDARD 17)\nset(CMAKE_CXX_STANDARD_REQUIRED ON)\n\nfind_package(Threads REQUIRED)\n\nadd_executable(main src/main.cpp src/greeting.cpp)\ntarget_include_directories(main PRIVATE include)\ntarget_link_libraries(main PRIVATE Threads::Threads)\n',
      },
      {
        type: 'file',
        name: 'README.md',
        content: '# C++ Project\n\nMinimal multi-file C++ hello world template.\n',
      },
      {
        type: 'folder',
        name: 'include',
        items: [
          {
            type: 'file',
            name: 'greeting.h',
            content:
              '#pragma once\n\n#include <chrono>\n\nconst char* getGreeting();\nvoid printWithTypingEffect(const char* text, int delay_ms = 100);\n',
          },
        ],
      },
      {
        type: 'folder',
        name: 'src',
        items: [
          {
            type: 'file',
            name: 'main.cpp',
            content: DEFAULT_CPP_MAIN,
          },
          {
            type: 'file',
            name: 'greeting.cpp',
            content:
              '#include "greeting.h"\n#include <iostream>\n#include <thread>\n\nconst char* getGreeting() {\n    return "Hello, World from C++ multiples files!";\n}\n\nvoid printWithTypingEffect(const char* text, int delay_ms) {\n    for (const char* p = text; *p; ++p) {\n        std::cout << *p << std::flush;\n        std::this_thread::sleep_for(std::chrono::milliseconds(delay_ms));\n    }\n}\n',
          },
        ],
      },
    ],
  },
];

const PREDEFINED_PROJECT_TEMPLATES = [
  {
    name: 'Python Multiple Files (Beta)',
    description: 'A simple Python project with multiple files demonstrating basic structure',
    data: JSON.stringify({ language: 'python', code: JSON.stringify(PYTHON_MULTI_FILES) }),
  },
  {
    name: 'Rust Multiple Files (Beta)',
    description: 'A minimal Rust multi-file hello world project',
    data: JSON.stringify({ language: 'rust', code: JSON.stringify(RUST_MULTI_FILES) }),
  },
  {
    name: 'C++ Multiples Files (Beta)',
    description: 'A minimal C++ multi-file hello world project',
    data: JSON.stringify({ language: 'cpp', code: JSON.stringify(CPP_MULTI_FILES) }),
  },
  {
    name: 'Empty Project',
    description: 'Empty project with no code',
    data: JSON.stringify({
      language: 'python',
      code: '',
      widget_config: '{"autorun": false, "widgets": []}',
      customer_journey: ' ',
    }),
  },
];

module.exports = PREDEFINED_PROJECT_TEMPLATES;
