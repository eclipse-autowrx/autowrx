const PROMPTS = `
'''
# This is a sample code to control low beam.
from sdv_model import Vehicle
from browser import aio

vehicle = Vehicle()
while True:
    await vehicle.Body.Lights.IsLowBeamOn.set(True)
    await aio.sleep(1)
    await vehicle.Body.Lights.IsLowBeamOn.set(False)
    await aio.sleep(1)
'''

'''
# support apis
# turn off wiper
await vehicle.Body.Windshield.Front.Wiping.Mode.set(vehicle.Body.Windshield.Front.Wiping.Mode.OFF)
# turn on wiper
await vehicle.Body.Windshield.Front.Wiping.Mode.set(vehicle.Body.Windshield.Front.Wiping.Mode.MEDIUM)
await vehicle.Body.Lights.IsLowBeamOn.set(True)
await vehicle.Driver.DistractionLevel.get()
await vehicle.Cabin.Seat.Row1.Pos1.Position.set(10)
await vehicle.Cabin.Seat.Row1.Pos1.Position.set(0)
await vehicle.Cabin.HVAC.Station.Row1.Left.FanSpeed.set(0)
await vehicle.Cabin.HVAC.Station.Row1.Left.FanSpeed.set(100)
await vehicle.Cabin.HVAC.Station.Row1.Right.FanSpeed.set(0)
await vehicle.Cabin.HVAC.Station.Row1.Right.FanSpeed.set(100)
rain_level =  await vehicle.Body.Raindetection.Intensity.get()
await vehicle.Body.Lights.IsHazardOn.set(True)
await vehicle.Body.Lights.IsHazardOn.set(False)
'''

'''
# app to control wiper
from sdv_model import Vehicle
from browser import aio

async def on_hood_is_open_changed(IsOpen: bool):
    print("Listener was triggered")
    if IsOpen:
        await vehicle.Body.Windshield.Front.Wiping.Mode.set(vehicle.Body.Windshield.Front.Wiping.Mode.OFF)
        print("Wipers were turned off because hood was opened")

print("subscribe for hood state change")
await vehicle.Body.Hood.IsOpen.subscribe(on_hood_is_open_changed)

'''

'''
# app to turn on wiper if rain level is high
from sdv_model import Vehicle
from browser import aio

async def on_rain_level_changed(level: int):
    if level>50:
        # turn on wiper
        await vehicle.Body.Windshield.Front.Wiping.Mode.set(vehicle.Body.Windshield.Front.Wiping.Mode.MEDIUM)
    else:
        # turn off wiper
        await vehicle.Body.Windshield.Front.Wiping.Mode.set(vehicle.Body.Windshield.Front.Wiping.Mode.OFF)

print("subscribe for hood state change")
await vehicle.Body.Raindetection.Intensity.subscribe(on_rain_level_changed)

'''

'''
# app to handle distraction level
from sdv_model import Vehicle
from browser import aio

vehicle = Vehicle()
risk_threshold = 50
max_fan_speed = 100
min_fan_speed = 0

while True:
    level = await vehicle.Driver.DistractionLevel.get()
    if level > risk_threshold:
        await vehicle.Body.Lights.IsHazardOn.set(True)
        await vehicle.Cabin.HVAC.Station.Row1.Left.FanSpeed.set(max_fan_speed)
        await vehicle.Cabin.HVAC.Station.Row1.Right.FanSpeed.set(max_fan_speed)
    else:
        await vehicle.Body.Lights.IsHazardOn.set(False)
        await vehicle.Cabin.HVAC.Station.Row1.Left.FanSpeed.set(min_fan_speed)
        await vehicle.Cabin.HVAC.Station.Row1.Right.FanSpeed.set(min_fan_speed)
    await aio.sleep(1)

'''

`;

export default PROMPTS;
