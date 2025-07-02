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
    widget: 'Single API Widget',
    icon: '/builtin-widgets/single-api/single-api.png',
    path: '/builtin-widgets/single-api/index.html',
    options: {
      label: 'Vehicle API Value',
      api: 'Vehicle.Cabin.HVAC.Station.Row1.Left.FanSpeed',
      valueClassname: 'text-3xl font-bold text-[#005072]',
      labelClassname: 'text-xl text-gray-700',
    },
  },
  {
    id: 'Table-APIs-Widget',
    plugin: 'Builtin',
    widget: 'Table APIs Widget',
    icon: '/builtin-widgets/table-apis/table-apis.png',
    path: '/builtin-widgets/table-apis/index.html',
    options: {
      apis: [
        'Vehicle.Cabin.HVAC.Station.Row1.Left.FanSpeed',
        'Vehicle.Cabin.HVAC.Station.Row1.Right.FanSpeed',
      ],
    },
  },
  {
    id: 'Chart-APIs-Widget',
    plugin: 'Builtin',
    widget: 'Chart APIs Widget',
    icon: '/builtin-widgets/chart-apis/chart-apis.png',
    path: '/builtin-widgets/chart-apis/index.html',
    options: {
      api: 'Vehicle.Cabin.HVAC.Station.Row1.Left.FanSpeed',
      lineColor: '#005072',
      dataUpdateInterval: '1000',
      maxDataPoints: '30',
    },
  },
  {
    id: 'Image-by-API-Value',
    plugin: 'Builtin',
    widget: 'Image by API Value',
    icon: '/builtin-widgets/image-by-api-value/image-by-api-value.png',
    path: '/builtin-widgets/image-by-api-value/index.html',
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
    },
  },
  {
    id: 'Fan-Widget',
    plugin: 'Builtin',
    widget: 'Fan-Widget',
    icon: '/builtin-widgets/simple-fan/simple-fan.png',
    path: '/builtin-widgets/simple-fan/index.html',
    options: {
      api: 'Vehicle.Cabin.HVAC.Station.Row1.Left.FanSpeed',
    },
  },
  {
    id: 'Wiper-Simulator',
    plugin: 'Builtin',
    widget: 'Wiper-Simulator',
    icon: '/builtin-widgets/simple-wiper/simple-wiper.png',
    path: '/builtin-widgets/simple-wiper/index.html',
    options: {
      fixed_api: 'Vehicle.Body.Windshield.Front.Wiping.Mode',
    },
  },
  //   {
  //     id: 'HVAC-Dreampack',
  //     plugin: 'Builtin',
  //     widget: 'HVAC-Dreampack',
  //     icon: '/imgs/hvac.png',
  //     options: {
  //       api_led_1: 'Vehicle.Body.Lights.IsBrakeOn',
  //       api_led_2: 'Vehicle.Body.Lights.IsLowBeamOn',
  //       api_led_3: 'Vehicle.Body.Lights.IsHazardOn',
  //       api_seat_pos: 'Vehicle.Cabin.Seat.Row1.Pos1.Position',
  //       api_fan_left: 'Vehicle.Cabin.HVAC.Station.Row1.Left.FanSpeed',
  //       api_fan_right: 'Vehicle.Cabin.HVAC.Station.Row1.Right.FanSpeed',
  //       path: '/builtin-widgets/simple-hvac/index.html',
  //     },
  //   },
  //   {
  //     id: 'GoogleMap-Directions',
  //     plugin: 'Builtin',
  //     widget: 'GoogleMap-Directions',
  //     icon: '/imgs/widget_maps_direction_alt.jpeg',
  //     options: {
  //       directions: [
  //         { lat: 48.149497, lng: 11.523194 },
  //         { lat: 50.445168, lng: 11.020569 },
  //       ],
  //       icon: '',
  //       path: '/builtin-widgets/google-map-directions/index.html',
  //     },
  //   },
  //   {
  //     id: 'Gauge',
  //     plugin: 'Builtin',
  //     widget: 'Gauge',
  //     icon: '/imgs/gauge.jpeg',
  //     options: {
  //       api: '',
  //       label: 'Label',
  //       minValue: 0,
  //       maxValue: 100,
  //       path: '/builtin-widgets/simple-gauge/index.html',
  //     },
  //   },
  //   {
  //     id: 'Drowsiness-Level',
  //     plugin: 'Builtin',
  //     widget: 'Drowsiness-Level',
  //     icon: '/imgs/drowsiness.png',
  //     options: {
  //       draw_boundary: true,
  //       set_to_api: 'Vehicle.Driver.FatigueLevel',
  //       path: '/builtin-widgets/drowsiness-level/index.html',
  //     },
  //   },
  //   {
  //     id: 'Driver-Distraction',
  //     plugin: 'Builtin',
  //     widget: 'Driver-Distraction',
  //     icon: '/imgs/driver-phone.png',
  //     options: {
  //       draw_boundary: true,
  //       set_to_api: 'Vehicle.Driver.DistractionLevel',
  //       path: '/builtin-widgets/driver-distraction/index.html',
  //     },
  //   },
  //   {
  //     id: 'Embedded-Widget',
  //     plugin: 'Builtin',
  //     widget: 'Embedded-Widget',
  //     icon: '/imgs/widget_iframe.png',
  //     options: {
  //       url: 'https://www.youtube.com/embed/ypR2cpdh6JA?si=IGhp44n5dTTbBD_p',
  //       path: '',
  //     },
  //   },
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
