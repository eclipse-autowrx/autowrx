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

const DEFAULT_RUST_MAIN = `use std::thread;
use std::time::Duration;

// Simulate EV system state
fn main() {
    // --- These variables will be captured by the AutoWRX Dashboard ---
    let mut battery_soc = 85.0;     // Battery State of Charge (%)
    #[allow(unused_assignments)]
    let mut vehicle_speed = 0.0;    // Speed (km/h)
    let mut motor_temp = 35.0;      // Motor temperature (°C)
    let mut odometer = 12450.0;     // Mileage (km)
    let mut is_charging = false;    // Charging status
    let mut is_light_on = false;    // Light status (for Dashboard testing)

    let mut tick = 0;

    println!("--- Rust EV System Started ---");
    println!("Monitoring parameters via IoT 'Cloud'...");

    loop {
        tick += 1;

        // 1. Simulate driving or charging logic
        if is_charging {
            battery_soc += 0.5;
            vehicle_speed = 0.0;
            motor_temp -= 0.1;
            if battery_soc >= 100.0 {
                battery_soc = 100.0;
                is_charging = false;
                println!("[System] Battery full! Charging stopped.");
            }
        } else {
            // Simulate driving
            vehicle_speed = 60.0 + (tick as f32 % 15.0); // Fluctuating speed
            battery_soc -= 0.05 * (vehicle_speed / 60.0);
            motor_temp += 0.2;
            odometer += vehicle_speed / 3600.0; // Distance traveled in 1 second

            // Low battery warning
            if battery_soc <= 15.0 {
                println!("[Warning] Low battery ({:.1}%)! Searching for charging station...", battery_soc);
                is_charging = true; // Automatically plug in for demo purposes
            }
        }

        // 2. Automatic light control logic (IoT)
        if tick % 10 == 0 {
            is_light_on = !is_light_on;
            println!("[IoT] Vehicle lights automatically {}.", if is_light_on { "turned ON" } else { "turned OFF" });
        }

        // 3. Simulate sending data to Cloud every 5 seconds (IoT Telemetry)
        if tick % 5 == 0 {
            println!("\\n[Cloud IoT Sync]");
            println!("{{ \\"device_id\\": \\"EV-RUST-001\\", \\"speed\\": {:.1}, \\"soc\\": {:.2}, \\"odo\\": {:.2}, \\"temp\\": {:.1} }}", 
                     vehicle_speed, battery_soc, odometer, motor_temp);
            println!("----------------------------\\n");
        }

        // Sleep for 1 second per loop
        thread::sleep(Duration::from_secs(1));
    }
}
`;

const RUST_MULTI_FILES = [
  {
    type: 'folder',
    name: 'rust-project',
    items: [
      {
        type: 'file',
        name: 'Cargo.toml',
        content: '[package]\nname = "rust_project"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\n',
      },
      {
        type: 'file',
        name: 'README.md',
        content: '# Rust Project\n\nMinimal Rust template.\n',
      },
      {
        type: 'folder',
        name: 'src',
        items: [
          {
            type: 'file',
            name: 'main.rs',
            content: DEFAULT_RUST_MAIN,
          },
        ],
      },
    ],
  },
];

const DEFAULT_CPP_MAIN = `#include <iostream>
#include <thread>
#include <chrono>
#include <iomanip>

int main() {
    // --- These variables will be captured by the AutoWRX Dashboard ---
    float battery_soc = 85.0f;      // Battery State of Charge (%)
    float vehicle_speed = 0.0f;     // Speed (km/h)
    float motor_temp = 35.0f;       // Motor temperature (°C)
    float odometer = 12450.0f;      // Mileage (km)
    bool is_charging = false;       // Charging status
    bool is_light_on = false;       // Light status (for Dashboard testing)

    int tick = 0;

    std::cout << "--- C++ EV System Started ---" << std::endl;
    std::cout << "Monitoring parameters via IoT 'Cloud'..." << std::endl;

    while (true) {
        tick++;

        // 1. Simulate driving or charging logic
        if (is_charging) {
            battery_soc += 0.5f;
            vehicle_speed = 0.0f;
            motor_temp -= 0.1f;
            if (battery_soc >= 100.0f) {
                battery_soc = 100.0f;
                is_charging = false;
                std::cout << "[System] Battery full! Charging stopped." << std::endl;
            }
        } else {
            // Simulate driving
            vehicle_speed = 60.0f + (tick % 15); // Fluctuating speed
            battery_soc -= 0.05f * (vehicle_speed / 60.0f);
            motor_temp += 0.2f;
            odometer += vehicle_speed / 3600.0f; // Distance traveled in 1 second

            // Low battery warning
            if (battery_soc <= 15.0f) {
                std::cout << "[Warning] Low battery (" << std::fixed << std::setprecision(1) << battery_soc << "%)! Searching for charging station..." << std::endl;
                is_charging = true; // Automatically plug in for demo purposes
            }
        }

        // 2. Automatic light control logic (IoT)
        if (tick % 10 == 0) {
            is_light_on = !is_light_on;
            std::cout << "[IoT] Vehicle lights automatically " << (is_light_on ? "turned ON" : "turned OFF") << "." << std::endl;
        }

        // 3. Simulate sending data to Cloud every 5 seconds (IoT Telemetry)
        if (tick % 5 == 0) {
            std::cout << "\\n[Cloud IoT Sync]" << std::endl;
            std::cout << "{ \\"device_id\\": \\"EV-CPP-001\\", \\"speed\\": " << std::fixed << std::setprecision(1) << vehicle_speed 
                      << ", \\"soc\\": " << std::fixed << std::setprecision(2) << battery_soc 
                      << ", \\"odo\\": " << std::fixed << std::setprecision(2) << odometer 
                      << ", \\"temp\\": " << std::fixed << std::setprecision(1) << motor_temp << " }" << std::endl;
            std::cout << "----------------------------\\n" << std::endl;
        }

        // Sleep for 1 second per loop
        std::this_thread::sleep_for(std::chrono::seconds(1));
    }

    return 0;
}
`;

const CPP_MULTI_FILES = [
  {
    type: 'folder',
    name: 'cpp-project',
    items: [
      {
        type: 'file',
        name: 'CMakeLists.txt',
        content:
          'cmake_minimum_required(VERSION 3.16)\nproject(cpp_project)\n\nset(CMAKE_CXX_STANDARD 17)\nset(CMAKE_CXX_STANDARD_REQUIRED ON)\n\nfind_package(Threads REQUIRED)\n\nadd_executable(main src/main.cpp)\ntarget_link_libraries(main PRIVATE Threads::Threads)\n',
      },
      {
        type: 'file',
        name: 'README.md',
        content: '# C++ Project\n\nMinimal C++ template.\n',
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
        ],
      },
    ],
  },
];

const DEFAULT_WIDGET_CONFIG = JSON.stringify({
  autorun: false,
  widgets: [
    {
      plugin: 'Builtin',
      widget: 'Embedded-Widget',
      options: {
        api: 'Vehicle.Body.Lights.Beam.Low.IsOn',
        defaultImgUrl: 'https://bestudio.digitalauto.tech/project/Ml2Sc9TYoOHc/light_off.png',
        displayExactMatch: true,
        valueMaps: [
          {
            value: true,
            imgUrl: 'https://bestudio.digitalauto.tech/project/Ml2Sc9TYoOHc/light_on.png',
          },
          {
            value: false,
            imgUrl: 'https://bestudio.digitalauto.tech/project/Ml2Sc9TYoOHc/light_off.png',
          },
        ],
        url: 'https://store-be.digitalauto.tech/data/store-be/Image%20by%20Signal%20value/latest/index/index.html',
        iconURL: 'https://upload.digitalauto.tech/data/store-be/3c3685b3-0b58-4f75-820e-9af0180cf3f0.png',
      },
      boxes: [2, 3, 7, 8],
      path: '',
    },
    {
      plugin: 'Builtin',
      widget: 'Embedded-Widget',
      options: {
        url: 'https://store-be.digitalauto.tech/data/store-be/Terminal/latest/terminal/index.html',
        iconURL: 'https://upload.digitalauto.tech/data/store-be/e991ea29-5fbf-42e9-9d3d-cceae23600f0.png',
      },
      boxes: [1, 6],
      path: '',
    },
    {
      plugin: 'Builtin',
      widget: 'Embedded-Widget',
      options: {
        api: 'Vehicle.Body.Lights.Beam.Low.IsOn',
        lineColor: '#005072',
        dataUpdateInterval: '1000',
        maxDataPoints: '30',
        url: 'https://store-be.digitalauto.tech/data/store-be/Chart%20Signal%20Widget/latest/index/index.html',
        iconURL: 'https://upload.digitalauto.tech/data/store-be/f25ceb29-b9e8-470e-897a-4d843e16a0cf.png',
      },
      boxes: [4, 5],
      path: '',
    },
    {
      plugin: 'Builtin',
      widget: 'Embedded-Widget',
      options: {
        apis: ['Vehicle.Body.Lights.Beam.Low.IsOn'],
        vss_json: 'https://bewebstudio.digitalauto.tech/data/projects/sHQtNwric0H7/vss_rel_4.0.json',
        url: 'https://store-be.digitalauto.tech/data/store-be/Signal%20List%20Settable/latest/table-settable/index.html',
        iconURL: 'https://upload.digitalauto.tech/data/store-be/dccabc84-2128-4e5d-9e68-bc20333441c4.png',
      },
      boxes: [9, 10],
      path: '',
    },
  ],
});

const PREDEFINED_PROJECT_TEMPLATES = [
  {
    name: 'Python Multiple Files (Beta)',
    description: 'A simple Python project with multiple files demonstrating basic structure',
    data: JSON.stringify({
      language: 'python',
      code: JSON.stringify(PYTHON_MULTI_FILES),
      widget_config: DEFAULT_WIDGET_CONFIG,
    }),
  },
  {
    name: 'Rust Project (Beta)',
    description: 'A minimal Rust template project',
    data: JSON.stringify({
      language: 'rust',
      code: JSON.stringify(RUST_MULTI_FILES),
      widget_config: DEFAULT_WIDGET_CONFIG,
    }),
  },
  {
    name: 'C++ Project (Beta)',
    description: 'A minimal C++ template project',
    data: JSON.stringify({
      language: 'cpp',
      code: JSON.stringify(CPP_MULTI_FILES),
      widget_config: DEFAULT_WIDGET_CONFIG,
    }),
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
