// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const templates = [
  {
    name: 'Chart Signals Dashboard',
    image: '',
    config: JSON.stringify({
      autorun: false,
      widgets: [
        {
          plugin: 'Builtin',
          widget: 'Embedded-Widget',
          options: {
            apis: [
              // Speed and movement
            ],
            colors: [
              '#005072',
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
              '#C9CBCF',
              '#8BC34A',
              '#FF5722',
              '#607D8B',
              '#E91E63',
              '#3F51B5',
              '#00BCD4',
              '#CDDC39',
              '#FF9800',
              '#9C27B0',
              '#795548',
            ],
            dataUpdateInterval: 1000,
            maxDataPoints: 60,
            url: `/builtin-widgets/chart-signals/index.html`,
            iconURL: '/builtin-widgets/chart-signals/chart-signals.png',
          },
          boxes: [1, 2, 3, 6, 7, 8],
          path: '',
        },
        {
          plugin: 'Builtin',
          widget: 'Embedded-Widget',
          options: {
            vss_json: '/builtin-widgets/signal-list-settable/vss.json',
            url: `/builtin-widgets/signal-list-settable/index.html`,
            iconURL:
              '/builtin-widgets/signal-list-settable/signal-list-settable.png',
          },
          boxes: [9, 10],
          path: '',
        },
        {
          plugin: 'Builtin',
          widget: 'Embedded-Widget',
          options: {
            apis: [''],

            url: `/builtin-widgets/terminal/index.html`,
            iconURL: '/builtin-widgets/terminal/terminal.png',
          },
          boxes: [4, 5],
          path: '',
        },
      ],
    }),
  },
  {
    name: 'General 3D Car Dashboard',
    image: '',
    config: JSON.stringify({
      autorun: false,
      widgets: [
        {
          plugin: 'Builtin',
          widget: 'Embedded-Widget',
          options: {
            leftDoorSignal: 'Vehicle.Cabin.Door.Row1.Left.IsOpen',
            rightDoorSignal: 'Vehicle.Cabin.Door.Row1.Right.IsOpen',
            leftSeatSignal: 'Vehicle.Cabin.Seat.Row1.Pos1.Position',
            rightSeatSignal: 'Vehicle.Cabin.Seat.Row1.Pos2.Position',
            trunkSignal: 'Vehicle.Body.Trunk.Rear.IsOpen',
            chassisHeightSignal: 'Vehicle.Chassis.Springs.HeightAdjustment',
            lowBeamSignal: 'Vehicle.Body.Lights.Beam.Low.IsOn',
            highBeamSignal: 'Vehicle.Body.Lights.Beam.High.IsOn',
            brakeLightSignal: 'Vehicle.Body.Lights.Brake.IsActive',
            hazardLightSignal: 'Vehicle.Body.Lights.Hazard.IsSignaling',
            wiperModeSignal: 'Vehicle.Body.Windshield.Front.Wiping.Mode',
            speedSignal: 'Vehicle.Speed',
            ambientLightHexSignal:
              'Vehicle.Cabin.Light.AmbientLight.Row1.Left.Color',
            ambientLightModeSignal: 'Vehicle.Cabin.Lights.InteriorLight.Mode',
            redLightSignal: 'Vehicle.Cabin.Lights.InteriorLight.Red',
            greenLightSignal: 'Vehicle.Cabin.Lights.InteriorLight.Green',
            blueLightSignal: 'Vehicle.Cabin.Lights.InteriorLight.Blue',
            url: `/builtin-widgets/3d-car/index.html`,
            // url: `http://localhost:5173`,
            iconURL: '/builtin-widgets/3d-car/3d-car.jpg',
          },
          boxes: [1, 2, 3, 6, 7, 8],
          path: '',
        },
        {
          plugin: 'Builtin',
          widget: 'Embedded-Widget',
          options: {
            vss_json: '/builtin-widgets/signal-list-settable/vss.json',
            url: `/builtin-widgets/signal-list-settable/index.html`,
            iconURL:
              '/builtin-widgets/signal-list-settable/signal-list-settable.png',
          },
          boxes: [9, 10],
          path: '',
        },
        {
          plugin: 'Builtin',
          widget: 'Embedded-Widget',
          options: {
            apis: [''],

            url: `/builtin-widgets/terminal/index.html`,
            iconURL: '/builtin-widgets/terminal/terminal.png',
          },
          boxes: [4, 5],
          path: '',
        },
      ],
    }),
  },
]

export default templates
