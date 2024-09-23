export default `from vehicle import Vehicle
import time
import asyncio
import signal

from sdv.vdb.reply import DataPointReply
from sdv.vehicle_app import VehicleApp
from vehicle import Vehicle, vehicle

class TestApp(VehicleApp):

    def __init__(self, vehicle_client: Vehicle):
        super().__init__()
        self.Vehicle = vehicle_client

    async def reset_all(self):
        await self.Vehicle.Cabin.Door.Row1.DriverSide.IsOpen.set(False)
        await self.Vehicle.Cabin.Seat.Row1.DriverSide.Position.set(0)

    async def on_start(self):
        print ("Reset demo runtime api value to default")
        await self.reset_all()
        await asyncio.sleep(2)
        print ("Start passenger welcome vehicle app")
        await asyncio.sleep(1)
        print ("Open driver side door")
        await self.Vehicle.Cabin.Door.Row1.DriverSide.IsOpen.set(True)
        await asyncio.sleep(3)
        print ("Adjust driver side seat")
        await self.Vehicle.Cabin.Seat.Row1.DriverSide.Position.set(10)
        await vehicle.Body.Mirrors.Left.Pan.get()
        await vehicle.Body.Mirrors.Right.Tilt.set(value)

async def main():
    vehicle_app = TestApp(vehicle)
    await vehicle_app.run()


LOOP = asyncio.get_event_loop()
LOOP.add_signal_handler(signal.SIGTERM, LOOP.stop)
LOOP.run_until_complete(main())
LOOP.close()
`
