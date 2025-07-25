// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { VehicleAPI } from '@/types/api.type'

export const customAPIs: VehicleAPI[] = [
  {
    description: 'Current speed of the vehicle.',
    isWishlist: false,
    name: 'Vehicle.Speed',
    parent: 'Vehicle',
    shortName: '.Speed',
    type: 'sensor',
    uuid: 'custom-uuid-speed',
  },
  {
    description: 'Type of vehicle body.',
    isWishlist: false,
    name: 'Vehicle.Body.BodyType',
    parent: 'Vehicle.Body',
    shortName: '.Body.BodyType',
    type: 'attribute',
    uuid: 'custom-uuid-bodytype',
  },
  {
    description: 'Status of high beam lights. True = On, False = Off.',
    isWishlist: false,
    name: 'Vehicle.Body.Lights.Beam.High.IsOn',
    parent: 'Vehicle.Body.Lights.Beam.High',
    shortName: '.Body.Lights.Beam.High.IsOn',
    type: 'actuator',
    uuid: 'custom-uuid-highbeam',
  },
  {
    description: 'Status of low beam lights. True = On, False = Off.',
    isWishlist: false,
    name: 'Vehicle.Body.Lights.Beam.Low.IsOn',
    parent: 'Vehicle.Body.Lights.Beam.Low',
    shortName: '.Body.Lights.Beam.Low.IsOn',
    type: 'actuator',
    uuid: 'custom-uuid-lowbeam',
  },
  {
    description: 'Status of tail lights. True = On, False = Off.',
    isWishlist: false,
    name: 'Vehicle.Body.Lights.Tail.IsOn',
    parent: 'Vehicle.Body.Lights.Tail',
    shortName: '.Body.Lights.Tail.IsOn',
    type: 'actuator',
    uuid: 'custom-uuid-taillights',
  },
  {
    description:
      'Status of brake lights activation. True = Active, False = Inactive.',
    isWishlist: false,
    name: 'Vehicle.Body.Lights.Brake.IsActive',
    parent: 'Vehicle.Body.Lights.Brake',
    shortName: '.Body.Lights.Brake.IsActive',
    type: 'actuator',
    uuid: 'custom-uuid-brakelights',
  },
  {
    description: 'Mode of the interior light.',
    isWishlist: false,
    name: 'Vehicle.Cabin.Lights.InteriorLight.Mode',
    parent: 'Vehicle.Cabin.Lights.InteriorLight',
    shortName: '.Cabin.Lights.InteriorLight.Mode',
    type: 'actuator',
    uuid: 'custom-uuid-interiorlight-mode',
  },
  {
    description: 'Intensity of the red interior light.',
    isWishlist: false,
    name: 'Vehicle.Cabin.Lights.InteriorLight.Red',
    parent: 'Vehicle.Cabin.Lights.InteriorLight',
    shortName: '.Cabin.Lights.InteriorLight.Red',
    type: 'actuator',
    uuid: 'custom-uuid-interiorlight-red',
  },
  {
    description: 'Intensity of the green interior light.',
    isWishlist: false,
    name: 'Vehicle.Cabin.Lights.InteriorLight.Green',
    parent: 'Vehicle.Cabin.Lights.InteriorLight',
    shortName: '.Cabin.Lights.InteriorLight.Green',
    type: 'actuator',
    uuid: 'custom-uuid-interiorlight-green',
  },
  {
    description: 'Intensity of the blue interior light.',
    isWishlist: false,
    name: 'Vehicle.Cabin.Lights.InteriorLight.Blue',
    parent: 'Vehicle.Cabin.Lights.InteriorLight',
    shortName: '.Cabin.Lights.InteriorLight.Blue',
    type: 'actuator',
    uuid: 'custom-uuid-interiorlight-blue',
  },
  {
    description: 'Adjustment of the chassis springs height.',
    isWishlist: false,
    name: 'Vehicle.Chassis.Springs.HeightAdjustment',
    parent: 'Vehicle.Chassis.Springs',
    shortName: '.Chassis.Springs.HeightAdjustment',
    type: 'actuator',
    uuid: 'custom-uuid-springs-height-adjustment',
  },
  {
    description: 'Warning state for front proximity detection.',
    isWishlist: false,
    name: 'Vehicle.ADAS.ProximityDetection.Front.IsWarning',
    parent: 'Vehicle.ADAS.ProximityDetection.Front',
    shortName: '.ADAS.ProximityDetection.Front.IsWarning',
    type: 'sensor',
    uuid: 'custom-uuid-front-iswarning',
  },
  {
    description: 'Warning state for left proximity detection.',
    isWishlist: false,
    name: 'Vehicle.ADAS.ProximityDetection.Left.IsWarning',
    parent: 'Vehicle.ADAS.ProximityDetection.Left',
    shortName: '.ADAS.ProximityDetection.Left.IsWarning',
    type: 'sensor',
    uuid: 'custom-uuid-left-iswarning',
  },
]
