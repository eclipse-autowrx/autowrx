export default `import asyncio
import logging
import signal
from vehicle import Vehicle, vehicle
from velocitas_sdk.util.log import get_opentelemetry_log_factory, get_opentelemetry_log_format
from velocitas_sdk.vdb.reply import DataPointReply
from velocitas_sdk.vehicle_app import VehicleApp
logging.setLogRecordFactory(get_opentelemetry_log_factory())
logging.basicConfig(format=get_opentelemetry_log_format())
logging.getLogger().setLevel('DEBUG')
logger = logging.getLogger(__name__)


class WelcomeAssistent(VehicleApp):

    def __init__(self, vehicle_client: Vehicle):
        super().__init__()
        self.Vehicle = vehicle_client

    async def on_start(self):
        await self.Vehicle.Cabin.Door.Row1.Left.IsOpen.subscribe(self.
            on_door_status_change)

    async def on_door_status_change(self, data: DataPointReply):
        """This will be executed when receiving a new door status update."""
        door_is_open = (await self.Vehicle.Cabin.Door.Row1.Left.IsOpen.get()
            ).value
        if door_is_open:
            logger.info("Driver's door opened.")
            await asyncio.gather(self.Vehicle.Cabin.Seat.Row1.Pos1.Position
                .set(1000), self.Vehicle.Body.Trunk.Rear.IsOpen.set(True),
                self.Vehicle.set_many().add(self.Vehicle.Cabin.Lights.
                InteriorLight.Blue, 255).add(self.Vehicle.Cabin.Lights.
                InteriorLight.Red, 0).add(self.Vehicle.Cabin.Lights.
                InteriorLight.Green, 0).apply(), self.Vehicle.Cabin.Lights.
                InteriorLight.Mode.set('FADE-IN'), self.Vehicle.Body.
                Windshield.Front.Wiping.Mode.set('FAST'), asyncio.sleep(2),
                self.Vehicle.Body.Windshield.Front.Wiping.Mode.set('OFF'),
                self.Vehicle.Chassis.Springs.HeightAdjustment.set(100))
            for _ in range(2):
                await self.Vehicle.Body.Lights.Beam.Low.IsOn.set(True)
                await asyncio.sleep(0.3)
                await self.Vehicle.Body.Lights.Beam.Low.IsOn.set(False)
                await asyncio.sleep(0.3)
        else:
            logger.info("Driver's door closed.")
            await asyncio.gather(self.Vehicle.Cabin.Seat.Row1.Pos1.Position
                .set(500), self.Vehicle.Body.Trunk.Rear.IsOpen.set(False),
                self.Vehicle.set_many().add(self.Vehicle.Cabin.Lights.
                InteriorLight.Red, 255).add(self.Vehicle.Cabin.Lights.
                InteriorLight.Blue, 0).add(self.Vehicle.Cabin.Lights.
                InteriorLight.Green, 0).apply(), self.Vehicle.Cabin.Lights.
                InteriorLight.Mode.set('FADE-IN'), asyncio.sleep(3), self.
                Vehicle.Cabin.Lights.InteriorLight.Mode.set('OFF'), self.
                Vehicle.Chassis.Springs.HeightAdjustment.set(800))


async def main():
    logger.info('Starting WelcomeAssistent app...')
    vehicle_app = WelcomeAssistent(vehicle)
    await vehicle_app.run()


LOOP = asyncio.get_event_loop()
LOOP.add_signal_handler(signal.SIGTERM, LOOP.stop)
LOOP.run_until_complete(main())
LOOP.close()
`
