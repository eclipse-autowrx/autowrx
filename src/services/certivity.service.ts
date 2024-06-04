// export interface CertivityCredentials {
//     access_token: string;
//     token_type: string;
//     expires_in: number;
// }

import { serverAxios } from './base'

export interface Regulation {
  key: string
  titleShort: string
  titleLong: string
  type: string
  region: string
}

export const supportedCertivityApis = new Set([
  'Vehicle.Powertrain.Transmission.CurrentGear',
  'Vehicle.Powertrain.Transmission.SelectedGear',
  'Vehicle.Powertrain.ElectricMotor.MaxPower',
  'Vehicle.Powertrain.ElectricMotor.MaxTorque',
  'Vehicle.Powertrain.ElectricMotor.MaxRegenPower',
  'Vehicle.Powertrain.ElectricMotor.MaxRegenTorque',
  'Vehicle.Powertrain.ElectricMotor.Rpm',
  'Vehicle.Powertrain.ElectricMotor.Temperature',
  'Vehicle.Powertrain.ElectricMotor.CoolantTemperature',
  'Vehicle.Powertrain.ElectricMotor.Power',
  'Vehicle.Powertrain.ElectricMotor.Torque',
  'Vehicle.Powertrain.TractionBattery',
  'Vehicle.Powertrain.TractionBattery.Temperature',
  'Vehicle.Powertrain.TractionBattery.StateOfCharge.Current',
  'Vehicle.Body.Hood',
  'Vehicle.Body.Hood.IsOpen',
  'Vehicle.Body.Trunk.IsOpen',
  'Vehicle.Body.Trunk.IsLocked',
  'Vehicle.Body.Mirrors',
  'Vehicle.Body.Mirrors.Left',
  'Vehicle.Body.Mirrors.Left.Tilt',
  'Vehicle.Body.Mirrors.Left.Pan',
  'Vehicle.Body.Mirrors.Left.Heating',
  'Vehicle.Body.Mirrors.Left.Heating.Status',
  'Vehicle.Body.Mirrors.Right',
  'Vehicle.Body.Mirrors.Right.Tilt',
  'Vehicle.Body.Mirrors.Right.Pan',
  'Vehicle.Body.Mirrors.Right.Heating',
  'Vehicle.Body.Mirrors.Right.Heating.Status',
  'Vehicle.Cabin.Sunroof',
  'Vehicle.Cabin.Sunroof.Position',
  'Vehicle.Cabin.Sunroof.Switch',
  'Vehicle.Cabin.Sunroof.Shade',
  'Vehicle.Cabin.Sunroof.Shade.Switch',
  'Vehicle.Cabin.Sunroof.Shade.Position',
  'Vehicle.Cabin.Door.Row1.Left.IsOpen',
  'Vehicle.Cabin.Door.Row1.Left.IsLocked',
  'Vehicle.Cabin.Door.Row1.Left.Window.isOpen',
  'Vehicle.Cabin.Door.Row1.Left.Window.Position',
  'Vehicle.Cabin.Door.Row1.Left.Window.ChildLock',
  'Vehicle.Cabin.Door.Row1.Left.Window.Switch',
  'Vehicle.Cabin.Door.Row1.Left.IsChildLockActive',
  'Vehicle.Cabin.Door.Row1.Left.Shade.Switch',
  'Vehicle.Cabin.Door.Row1.Left.Shade.Position',
  'Vehicle.Cabin.Door.Row1.Right.IsOpen',
  'Vehicle.Cabin.Door.Row1.Right.IsLocked',
  'Vehicle.Cabin.Door.Row1.Right.Window.isOpen',
  'Vehicle.Cabin.Door.Row1.Right.Window.Position',
  'Vehicle.Cabin.Door.Row1.Right.Window.ChildLock',
  'Vehicle.Cabin.Door.Row1.Right.Window.Switch',
  'Vehicle.Cabin.Door.Row1.Right.IsChildLockActive',
  'Vehicle.Cabin.Door.Row1.Right.Shade.Switch',
  'Vehicle.Cabin.Door.Row1.Right.Shade.Position',
  'Vehicle.Cabin.Door.Row2.Left.IsOpen',
  'Vehicle.Cabin.Door.Row2.Left.IsLocked',
  'Vehicle.Cabin.Door.Row2.Left.Window.isOpen',
  'Vehicle.Cabin.Door.Row2.Left.Window.Position',
  'Vehicle.Cabin.Door.Row2.Left.Window.ChildLock',
  'Vehicle.Cabin.Door.Row2.Left.Window.Switch',
  'Vehicle.Cabin.Door.Row2.Left.IsChildLockActive',
  'Vehicle.Cabin.Door.Row2.Left.Shade.Switch',
  'Vehicle.Cabin.Door.Row2.Left.Shade.Position',
  'Vehicle.Cabin.Door.Row2.Right.IsOpen',
  'Vehicle.Cabin.Door.Row2.Right.IsLocked',
  'Vehicle.Cabin.Door.Row2.Right.Window.isOpen',
  'Vehicle.Cabin.Door.Row2.Right.Window.Position',
  'Vehicle.Cabin.Door.Row2.Right.Window.ChildLock',
  'Vehicle.Cabin.Door.Row2.Right.Window.Switch',
  'Vehicle.Cabin.Door.Row2.Right.IsChildLockActive',
  'Vehicle.Cabin.Door.Row2.Right.Shade.Switch',
  'Vehicle.Cabin.Door.Row2.Right.Shade.Position',
])

// export const getCertivityCredentialsService = async () =>
//     (await certivityAxios.get<CertivityCredentials>("/certivity/credentials")).data;

export const getCertivityRegulationsService = async (apis: string[]) =>
  (
    await serverAxios.get<Regulation[]>('/certivity/regulations', {
      params: {
        vehicleApis: apis.join(','),
      },
    })
  ).data
