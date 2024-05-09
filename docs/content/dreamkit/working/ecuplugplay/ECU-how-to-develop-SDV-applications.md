---
title: "Develop SDV applications to interact with your ECUs"
date: 2024-05-06T07:01:23+07:00
draft: false
weight: 9
---

In this tutorial, we'll walk you through a simple yet illustrative example: creating and deploying a simple LED blinking application to an ECU.

Before going into the coding and deployment, you could explore the [digital.auto](https://www.digital-auto.org/) ecosystem to better understand the capabilities and features of dreamKIT. For a preview of what our team has done with the dreamKIT, please watch our [videos](https://youtube.com/playlist?list=PLJ_UU5lKzLPrFau3iMGTaBfRGQGulfCpJ&si=dLVU6kzulmqTlQV8). These resources provide you with insights and inspiration for your projects.

## Prerequisites

To better follow the guide, you should:
- Have successfully connected your ECUs to the dreamKIT via the CAN ports. The tutorial for making connections with ECUs is [here](https://docs.digital.auto/dreamkit/working/ecuplugplay/ecu-how-to-identify-your-ecu/).
- Have a playground.digital.auto account (refer to the link [here](https://docs.digital.auto/basics/login/#2-sign-up) to sign up) and familiarize yourself with the playground platform.
- Look through the tutorial [Create 'Hello World' Prototype](https://docs.digital.auto/engaged/helloworld/) to understand more about how to create a prototype on our playground platform.
> **Note**: If you have any problem doing this tutorial, please don't hesitate to [contact us](#need-assistance-contact-our-development-team) for assistance.


## What You Will Achieve

By the end of this guide, you will understand how to develop and deploy an SDV application to your ECU. You will soon be able to create more SDV applications and showcase them with your ECU.

Let's get started and turn your ideas into reality with the dreamKIT!
![dreamKIT](https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FdrewKIT.jpg?alt=media&token=9b2f7dbf-35a4-4baf-8c87-904efc5eb6f0)




## 1. Virtual prototyping on the digital.auto playground platform

### 1.1. The LED Blinking application

If you are new to the [digital.auto playground](https://digitalauto.netlify.app/) platform, please access the platform, and then go through this [tutorial](https://digital-auto.github.io/playground/engaged/helloworld/) and follow from **"1. Login"**, find and pick **dreamKIT** model in **"2. Create a Vehicle Model"**, and follow along to **"4. Write simple headlight-blinking code"**.

The result after following suggested tutorial is expected to be like this:
![playground blinking code](https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2Fplayground-simple-LED-blinking.png?alt=media&token=d9db856b-a11d-42f3-a877-43bc121a160c)

The **simple LED blinking** code should look like this:
```python
from sdv_model import Vehicle
import plugins
from browser import aio

vehicle = Vehicle()

for i in range(10):
    # code to turn headlight on
    await self.Vehicle.Body.Lights.IsLowBeamOn.set(True)
    await aio.sleep(1)

    # code to turn headlight off
    await self.Vehicle.Body.Lights.IsLowBeamOn.set(False)
    await aio.sleep(1)
```

Now that we have successfully created our prototype on the Playground. One takeaway is the name of the VSS signal used for our LED blinking application: **Vehicle.Body.Lights.IsLowBeamOn**. We need to remember this for the upcoming steps in our tutorial.

Let's deploy the code to our dreamKIT.

### 1.2. Deploy the prototype to dreamKIT

The **Deploy** functionality will send our prototype to the dreamKIT via a network connection, so we need to add a Wifi connection to our dreamKIT to allow this over-the-air (OTA) deploying function to operate.

1. First, we need to make sure that our dreamKIT is connected to Wifi. If your dreamKIT has not been connected to any wireless network yet, then please read the following instructions to connect one:
- Our IVI is a touchscreen display. From the startup screen on the IVI, please swipe from the outer left side of the screen to the right to get out of the dreamKIT software window. Then we can access to the settings button on the top right corner and tap it.
  ![swipe tap 1](https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FIVI-swipe-tap-wifi.jpg?alt=media&token=d006d3e6-3956-4522-a803-f7940091bc16)
  ![swipe tap 2](https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FIVI-swipe-tap-wifi-2.jpg?alt=media&token=ac46bc5e-da64-4f31-acce-e0e9b5c96633)
  ![swipe tap 3](https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FIVI-swipe-tap-wifi-3.jpg?alt=media&token=6a63d55e-72cd-4f1f-a60f-1575b6fcf49b)
- As you can see the online status of our dreamKIT is now displaying **"Server: connected"**. You must also pay close attention to the **"ID:"** information section, too. The last 8 digits of dreamKIT's ID will be used to recognize your dreamKIT when deploying apps on digital.auto playground!
  ![IVI wifi connected 2](https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FIVI-wifi-connected-2.jpg?alt=media&token=151ef028-311e-4237-acd4-2e9bec2fe8b7)

2. Now let's deploy our SDV application. In this example, I will deploy my LED blinking app ^^
- Go to your created prototype on Playground:
![playground library selected 2](https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2Fplayground-prototype-library-selected-2.png?alt=media&token=5678e786-cdea-4898-a500-c97a500209f9)
- Under the **Code** tab, click the **Deploy** button.
![playground deploy button selected 2](https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2Fplayground-deploy-button-selected-2.png?alt=media&token=c4f2fdb1-725a-47ba-b68b-f22f725facfd)
- If your dreamKIT is online, under the **Deployment** window can you find your dreamKIT model online status. Please choose your dreamKIT and finally click **Deploy**.
![playground deploy button selected 3](https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2Fplayground-deploy-button-selected-3.png?alt=media&token=a10b8f8b-6665-453d-a829-cd5f1fce13be)
- Deploying...
![playground deploying status](https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2Fplayground-deploying-status.png?alt=media&token=235908a4-d5da-40ec-a5c1-d61555aff3af)
- A notification "**There is an update from ETAS**" will appear on the IVI, and your prototype will also appear in the Vehicle Apps list. The picture below shows my app that has been successfully deployed.
![IVI-deploying](https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FIVI-deploying.jpg?alt=media&token=64941551-ea44-45c3-82c5-08dcd3ab6ec8)
![IVI-deploying app](https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FIVI-deployed-app.jpg?alt=media&token=b9f9d24b-acdf-4ca9-9df8-3905d4a87fe8)



<!-- Insert section 2 here -->
<!-- ## 2. Create the mapping from VSS to DBC signals -->

## 2. Mapping VSS to DBC signals

In this section, we are going to utilize the [digital.auto playground](https://digitalauto.netlify.app/) platform to help us quickly deploy the VSS to DBC signals mapping. Our SDV application written on the [digital.auto playground](https://digitalauto.netlify.app/) interacts with the Vehicle Signal Specification (VSS), while our automotive ECU operates with the database CAN (DBC) signals. The mapping action allows our ECU to understand, and be able to perform your application.

<!--To learn more about the VSS by COVESA, please refer to this [link](https://covesa.github.io/vehicle_signal_specification/).-->

### 2.1. Access the APIs mapping function

> For the **API Mapping** functionality to be available, please [request us](#need-assistance-contact-our-development-team) for the permission. After the edit permission of this function is granted, you can now choose to open the **API Mapping** tab:

On [digital.auto playground](https://digitalauto.netlify.app/) platform please access the **APIs mapping** function by following the steps:
1. After choosing the dreamKIT model, please click on **Vehicle APIs**:
![playground select vehicle apis function](https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2Fplayground-select-vehicle-apis-function.jpg?alt=media&token=8618f843-1594-4d0e-a20b-6592182a0631)


2. Click on the **API Mapping** functionality.
![playground api mapping function click](https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2Fplayground-api-mapping-function-click.jpg?alt=media&token=92f3dd4a-714f-4121-8fb4-1c9c5aed4f85)

This **API Mapping** tab will allow you to explore the VSS signals and create the signal mapping. You can also export the mapping and import that configuration later on.

### 2.2. Create your signal mapping from VSS to DBC

Remember the VSS signal **Vehicle.Body.Lights.IsLowBeamOn** that we used on the prototype? Up to this stage, your ECU cannot understand what to do with this signal. Your ECU can only understand DBC signals on CAN, so a mapping action is required, to translate the VSS signal to what your ECU can work with.

The process is shown in the example image below. You will need to: 
  1. Input your ECU information. 
  2. Then map the **Vehicle.Body.Lights.IsLowBeamOn** with your DBC signal. Our example ECU uses **DAS_headlightRequest** for controlling the LED, so in this example I will map **Vehicle.Body.Lights.IsLowBeamOn** with **DAS_headlightRequest**.
  3. Then you will follow up with selecting your dreamKIT model in the list.
  4. Deploy the mapping!
![playground signal mapping](https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2Fplayground-signal-mapping.jpg?alt=media&token=27cd00b2-f2a0-4479-95ec-45ac530c180d)

Now the ECU will be able to understand applications written using VSS signals.

You can now test your Vehicle App by simply sliding the button on your application on the IVI. A notification will pop up to tell you that your app has been toggled successfully.
![IVI turn on app 2](https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FIVI-turn-on-app-2.jpg?alt=media&token=1d27e723-d3dc-4bb2-b1b8-b793e4145abf)

Watch how the changes you have made act on your ECU. On our **dreamPACK_ECU**, the LED is now blinking!
![dreamPACK blinking](https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FdreamPACK_blinking-3.jpg?alt=media&token=26054eda-0a47-4aaf-9c34-c6e231b6120e)



<!--## Section 3. Create your first prototype directly on dreamKIT using Python scripts-->

## 3. Create your SDV application directly on the dreamKIT

Another way to develop applications for your ECU is by creating Python scripts on the dreamKIT. The Python template for SDV application development is provided by Velocitas. From this template, developers can further develop their applications based on those pre-defined templates for higher efficiency. The Python template can be accessed [here](https://github.com/eclipse-velocitas/vehicle-app-python-template).

Our LED blinking example, when written in the form of a Python code, will look like this:
```python
import asyncio
import json
import logging
from logging.handlers import RotatingFileHandler
import signal

from sdv.util.log import (
    get_opentelemetry_log_factory,
    get_opentelemetry_log_format,
)
from sdv.vdb.reply import DataPointReply
from sdv.vehicle_app import VehicleApp
from vehicle import Vehicle, vehicle

# Configure the VehicleApp logger with the necessary log config and level.
logging.setLogRecordFactory(get_opentelemetry_log_factory())
logging.basicConfig(filename='app.log', filemode='a',format="[%(asctime)s] %(message)s")
logging.getLogger().setLevel("INFO")
logger = logging.getLogger(__name__)
handler = RotatingFileHandler('app.log', maxBytes=1048576, backupCount=1)
logger.addHandler(handler)

class test_simpleLedBlinkingApp(VehicleApp):
    """Velocitas App for test_simpleLedBlinking."""
    
    def __init__(self, vehicle_client: Vehicle):
        super().__init__()
        self.Vehicle = vehicle_client
        self.home = None
        self.stop = None
        
    async def on_start(self):
        for i in range(10):
            await self.Vehicle.Body.Lights.IsLowBeamOn.set(True)
            await asyncio.sleep(1)
            await self.Vehicle.Body.Lights.IsLowBeamOn.set(False)
            await asyncio.sleep(1)
        
async def main():
    logger.info("Starting test_simpleLedBlinkingApp...")
    vehicle_app = test_simpleLedBlinkingApp(vehicle)
    await vehicle_app.run()
    
LOOP = asyncio.get_event_loop()
LOOP.add_signal_handler(signal.SIGTERM, LOOP.stop)
LOOP.run_until_complete(main())
```

For a quick run please go to your Python script location in the dreamKIT file system, and then run:
```bash
$ HOME_PATH=~
$ dapr run --app-id testapp --app-protocol grpc --resources-path $HOME_PATH/.dapr/components --config $HOME_PATH/.dapr/config.yaml --app-port 50008 python3 /your_python_directory/your_file.py$
```

> ***Tip***: It is more advantageous to write prototypes using the manual method, as it is easier for us to integrate our Python script with third-party components into our system during the application's development!

## Need assistance? Contact our development team

For the VCU and Gateway usernames, IP addressed, SSH passwords, the "API mapping" function permission, or any further issues, please do not hesitate contact our developing team via the following addresses:
- phong.phamtuan@vn.bosch.com
- tam.thaihoangminh@vn.bosch.com

Our team is committed to providing you with the necessary support to address your queries and challenges promptly.

## Related Documentations
- To learn more about Vehicle Signal Specification (VSS): please refer to this [link](https://covesa.github.io/vehicle_signal_specification/).
- To learn more about KUKSA.val, the in-vehicle software components for working with in-vehicle signals COVESA VSS: please refer to this [link](https://github.com/eclipse/kuksa.val)
- To learn more on how Velocitas has helped us in faster application prototyping, please refer to the documentations provided [here](https://eclipse.dev/velocitas/docs/).
