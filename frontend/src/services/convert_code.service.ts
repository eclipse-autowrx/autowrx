// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import axios from "axios"

let prefix_copyright = `
import asyncio
import json
import logging
from logging.handlers import RotatingFileHandler
import signal

from sdv.util.log import (  # type: ignore
    get_opentelemetry_log_factory,
    get_opentelemetry_log_format,
)
from sdv.vdb.reply import DataPointReply
from sdv.vehicle_app import VehicleApp
from vehicle import Vehicle, vehicle  # type: ignore

# Configure the VehicleApp logger with the necessary log config and level.
logging.setLogRecordFactory(get_opentelemetry_log_factory())
logging.basicConfig(filename='app.log', filemode='a',format="[%(asctime)s] %(message)s")
logging.getLogger().setLevel("INFO")
logger = logging.getLogger(__name__)
handler = RotatingFileHandler('app.log', maxBytes=1048576, backupCount=1)
logger.addHandler(handler)`

let header = `from vehicle import Vehicle
import time
import asyncio
import signal

from sdv.vdb.reply import DataPointReply
from sdv.vehicle_app import VehicleApp
from vehicle import Vehicle, vehicle

`


export const convertCode = async (codeV1: string) => {
    if (!codeV1) return ""
    try {
        let res = await axios.post("https://kit.digitalauto.tech/convertCode", {
            code: codeV1
        })
        if(res.data && res.data.content) {
            let convertedCode = res.data.content
            convertedCode = convertedCode.substring(convertedCode.indexOf("class"))
            convertedCode = convertedCode.split('logger.info').join('print')
            return header + convertedCode
        }
    } catch (err) {
        console.log(err)
     }
    return codeV1
}
