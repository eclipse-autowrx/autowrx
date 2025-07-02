// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

export default `# pylint: disable=C0103, C0413, E1101
import asyncio
import logging
import signal

from vehicle import Vehicle, vehicle  # type: ignore
from velocitas_sdk.util.log import (  # type: ignore
    get_opentelemetry_log_factory,
    get_opentelemetry_log_format,
)
from velocitas_sdk.vdb.reply import DataPointReply
from velocitas_sdk.vehicle_app import VehicleApp

# Configure the VehicleApp logger with the necessary log config and level.
logging.setLogRecordFactory(get_opentelemetry_log_factory())
logging.basicConfig(format=get_opentelemetry_log_format())
logging.getLogger().setLevel("DEBUG")
logger = logging.getLogger(__name__)


class WelcomeAssistantVehicleApp(VehicleApp):
    def __init__(self, vehicle_client: Vehicle):
        super().__init__()
        self.Vehicle = vehicle_client

    async def on_start(self):
        # Callback
        await self.Vehicle.Cabin.Door.Row1.Left.IsOpen.subscribe(
            self.on_door_status_change
        )

    async def on_door_status_change(self, data: DataPointReply):
        """This will be executed when receiving a new door status update."""
        door_is_open = (await self.Vehicle.Cabin.Door.Row1.Left.IsOpen.get()).value

        if door_is_open:
            logger.info("Door opened.")
            await self.Vehicle.set_many().add(
                self.Vehicle.Cabin.Lights.InteriorLight.Mode, "FADE-IN"
            ).add(self.Vehicle.Cabin.Lights.InteriorLight.Red, 0).add(
                self.Vehicle.Cabin.Lights.InteriorLight.Green, 0
            ).add(
                self.Vehicle.Cabin.Lights.InteriorLight.Blue, 255
            ).add(
                self.Vehicle.Cabin.Seat.Row1.Pos1.Position, 1000
            ).add(
                self.Vehicle.Chassis.Springs.HeightAdjustment, 100
            ).apply()
        else:
            logger.info("Door closed.")
            await self.Vehicle.set_many().add(
                self.Vehicle.Cabin.Seat.Row1.Pos1.Position, 500
            ).add(
                self.Vehicle.Chassis.Springs.HeightAdjustment, 800
            ).apply()
            await asyncio.sleep(2)
            await self.Vehicle.Cabin.Lights.InteriorLight.Mode.set("OFF")


async def main():
    logger.info("Starting Welcome Assistant vehicle app...")
    vehicle_app = WelcomeAssistantVehicleApp(vehicle)
    await vehicle_app.run()


LOOP = asyncio.get_event_loop()
LOOP.add_signal_handler(signal.SIGTERM, LOOP.stop)
LOOP.run_until_complete(main())
LOOP.close()
`
