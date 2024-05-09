---
title: "Overview"
date: 2023-08-02T07:05:26+07:00
draft: false
weight: 6
---

## 1. Overview

The open and web based [digital.auto](https://digitalauto.netlify.app/) playground offers a rapid prototyping environment to explore and validate ideas of a _Vehicle App_.  
[digital.auto](https://digitalauto.netlify.app/) interacts with different vehicle sensors and actuators via standardized APIs specified by the COVESA [Vehicle Signal Specification (VSS)](https://covesa.github.io/vehicle_signal_specification/introduction/) without custom setup requirements.  
Within the platform you can:

-   browse, navigate and enhance vehicle signals (sensors, actuators and branches) in the [Vehicle API Catalogue](https://digitalauto.netlify.app/model/STLWzk1WyqVVLbfymb4f/cvi/list) mapped to a 3D model of the vehicle.
-   build _Vehicle App_ prototypes in the browser using Python and the Vehicle API Catalogue.
-   test the _Vehicle App_ prototype in a dashboard with 3D animation for API calls.
-   create new plugins, which usually represent UX widgets or remote server communication to enhance the vehicle mockup experience in the playground.
-   collect and evaluate user feedback to prioritize your development portfolio.

## 2. Start the journey of a _Vehicle App_

As first step open [digital.auto](https://digitalauto.netlify.app/), select [_Get Started_](https://digitalauto.netlify.app/model) in the prototyping section of the landing page and use the Vehicle Model of your choice.

![digital.auto](./images/digital-auto.png) ![vehicle-models](./images/vehicle-models.png)

You now have the possibility to browse existing vehicle signals for the selected vehicle model which you can use for prototyping your _Vehicle App_ by clicking on _Vehicle APIs_.

![selected-model](./images//selected-model.png) ![cvi-catalogue](./images/cvi-catalogue.png)

### 2.1. Add additional _Vehicle APIs_

#### Note

For this feature, a digital.auto account is required. Move on to the [Login](https://docs.digital.auto/basics/login/) page to learn how to simply create an account for the playground.
If the ideation of your _Vehicle App_ prototype comes with any new Vehicle API which is not part of the standard [VSS](https://covesa.github.io/vehicle_signal_specification/introduction/) you also have the option to include it into your pre-selected model by clicking the _\+ New Wishlist API_ button. After filling out all required fields, simply click the _create_ button - this will commit the new API to the existing model.

![wishlist](./images/wishlist.png)

### 2.2. Prototype an idea of a _Vehicle App_

The next step would be to prototype your idea. To do so:

-   Click on _Prototype Library_ of your selected model. ![prototype-library](./images/prototype-library.png)
-   Create a new prototype, by clicking on _New Prototype_ and filling out the information or select one from the list.
-   Click on the _Open_ button. ![select-prototype](./images/select-prototype.png)
-   Go to the _Code_ section and start your prototype right away. ![code-section](./images/code-section.png)

### 2.3. Test the prototype of a _Vehicle App_

Testing of your prototype starts in the _Run_ section.  
You will find a dashboard consisting all vehicle and application components similar to mockups.  
The control center on the right side has an integrated terminal showing all of your prototyped outputs as well as a list of all called VSS API’s.  
The _Run_ button executes all your prototype code from top to bottom. The _Debug_ button allows you to step through your prototype line by line.

![run-section](./images/run-section.png)

To get started quickly, the digital.auto team has added a number of widgets to simulate related elements of the vehicle – like doors, seats, light, etc. – and made them available in the playground.
