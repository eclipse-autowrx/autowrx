// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const BUILT_IN_WIDGETS = [
  {
    id: 'Single-API-Widget',
    plugin: 'Builtin',
    widget: 'Single Signal Widget',
    label: 'Single Signal Widget',
    icon: '/builtin-widgets/single-api/single-api.png',
    path: '/builtin-widgets/single-api/index.html',
    desc: 'Display a single vehicle signal value',
    options: {
      label: 'Vehicle API Value',
      api: 'Vehicle.Cabin.HVAC.Station.Row1.Driver.FanSpeed',
      valueClassname: 'text-3xl font-bold text-[#005072]',
      labelClassname: 'text-xl text-gray-700',
      iconURL: '/builtin-widgets/single-api/single-api.png',
    },
  },
  {
    id: 'Chart-Signals-Widget',
    plugin: 'Builtin',
    widget: 'Chart Signals Widget',
    label: 'Chart Multiple Signals',
    icon: '/builtin-widgets/chart-signals/chart-signals.png',
    path: '/builtin-widgets/chart-signals/index.html',
    desc: 'Visualize multiple signals in one chart',
    options: {
      apis: [
        'Vehicle.Cabin.HVAC.Station.Row1.Driver.FanSpeed',
        'Vehicle.Cabin.HVAC.Station.Row1.Passenger.FanSpeed',
      ],
      dataUpdateInterval: 1000,
      maxDataPoints: 60,
      iconURL: '/builtin-widgets/chart-signals/chart-signals.png',
    },
  },
  {
    id: 'Signal-List-Settable',
    plugin: 'Builtin',
    widget: 'Signal List Settable',
    label: 'Signal List Settable',
    icon: '/builtin-widgets/signal-list-settable/signal-list-settable.png',
    path: '/builtin-widgets/signal-list-settable/index.html',
    desc: 'Display and modify multiple vehicle signals',
    options: {
      apis: [
        'Vehicle.Cabin.HVAC.Station.Row1.Driver.FanSpeed',
        'Vehicle.Cabin.HVAC.Station.Row1.Passenger.FanSpeed',
      ],
      iconURL: '/builtin-widgets/signal-list-settable/signal-list-settable.png',
    },
  },
  {
    id: 'Terminal-Widget',
    plugin: 'Builtin',
    widget: 'Terminal',
    label: 'Terminal',
    icon: '/builtin-widgets/terminal/terminal.png',
    path: '/builtin-widgets/terminal/index.html',
    desc: 'Display system logs and runtime output',
    options: {
      iconURL: '/builtin-widgets/terminal/terminal.png',
    },
  },
  {
    id: 'Image-by-API-Value',
    plugin: 'Builtin',
    widget: 'Image by Signal value',
    label: 'Image by Signal value',
    icon: '/builtin-widgets/image-by-api-value/image-by-api-value.png',
    path: '/builtin-widgets/image-by-api-value/index.html',
    desc: 'Display different images based on signal value',
    options: {
      api: 'Vehicle.A.B.C',
      defaultImgUrl: 'https://placehold.co/100x100',
      displayExactMatch: true,
      valueMaps: [
        {
          value: 10,
          imgUrl: 'https://placehold.co/200x200',
        },
        {
          value: 20,
          imgUrl: 'https://placehold.co/300x300',
        },
        {
          value: 30,
          imgUrl: 'https://placehold.co/400x400',
        },
        {
          value: 40,
          imgUrl: 'https://placehold.co/500x500',
        },
      ],
      iconURL: '/builtin-widgets/image-by-api-value/image-by-api-value.png',
    },
  },
  {
    id: '3D-Car-Widget',
    plugin: 'Builtin',
    widget: 'General 3D Car Model',
    label: 'General 3D Car Model',
    icon: '/builtin-widgets/3d-car/3d-car.jpg',
    path: '/builtin-widgets/3d-car/index.html',
    desc: 'Interactive 3D car visualization',
    options: {
      leftDoorSignal: 'Vehicle.Cabin.Door.DriverSide.Left.IsOpen',
      rightDoorSignal: 'Vehicle.Cabin.Door.DriverSide.Right.IsOpen',
      leftSeatSignal: 'Vehicle.Cabin.Seat.DriverSide.Pos1.Position',
      rightSeatSignal: 'Vehicle.Cabin.Seat.DriverSide.Pos2.Position',
      trunkSignal: 'Vehicle.Body.Trunk.Rear.IsOpen',
      chassisHeightSignal: 'Vehicle.Chassis.Springs.HeightAdjustment',
      lowBeamSignal: 'Vehicle.Body.Lights.Beam.Low.IsOn',
      highBeamSignal: 'Vehicle.Body.Lights.Beam.High.IsOn',
      brakeLightSignal: 'Vehicle.Body.Lights.Brake.IsActive',
      hazardLightSignal: 'Vehicle.Body.Lights.Hazard.IsSignaling',
      wiperModeSignal: 'Vehicle.Body.Windshield.Front.Wiping.Mode',
      speedSignal: 'Vehicle.Speed',
      ambientLightHexSignal:
        'Vehicle.Cabin.Light.AmbientLight.DriverSide.Left.Color',
      ambientLightModeSignal: 'Vehicle.Cabin.Lights.InteriorLight.Mode',
      redLightSignal: 'Vehicle.Cabin.Lights.InteriorLight.Red',
      greenLightSignal: 'Vehicle.Cabin.Lights.InteriorLight.Green',
      blueLightSignal: 'Vehicle.Cabin.Lights.InteriorLight.Blue',
      iconURL: '/builtin-widgets/3d-car/3d-car.jpg',
    },
  },
  {
    id: 'Fan-Widget',
    plugin: 'Builtin',
    widget: 'Simple Fan Widget',
    label: 'Simple Fan Widget',
    icon: '/builtin-widgets/simple-fan/simple-fan.png',
    path: '/builtin-widgets/simple-fan/index.html',
    desc: 'Animated fan based on signal value',
    options: {
      api: 'Vehicle.Cabin.HVAC.Station.Row1.Driver.FanSpeed',
      iconURL: '/builtin-widgets/simple-fan/simple-fan.png',
    },
  },
  {
    id: 'Wiper-Simulator',
    plugin: 'Builtin',
    widget: 'Simple Wiper Widget',
    label: 'Simple Wiper Widget',
    icon: '/builtin-widgets/simple-wiper/simple-wiper.png',
    path: '/builtin-widgets/simple-wiper/index.html',
    desc: 'Windshield wiper simulator',
    options: {
      api: 'Vehicle.Body.Windshield.Front.Wiping.Mode',
      iconURL: '/builtin-widgets/simple-wiper/simple-wiper.png',
    },
  },
]

export const BUILT_IN_EMBEDDED_WIDGETS = {
  id: 'Embedded-Widget',
  plugin: 'Builtin',
  widget: 'Embedded-Widget',
  // icon: '/imgs/widget_iframe.png',
  options: {
    url: '<place_widget_url_here>',
  },
}

export default BUILT_IN_WIDGETS
