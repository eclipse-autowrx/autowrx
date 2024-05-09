---
title: "Architecture"
date: 2023-08-03T06:48:57+07:00
draft: false
weight: 1
---

## Getting started

Please have a look at image below.

![architecture-from-playground-to-dreamKIT](https://bewebstudio.digitalauto.tech/data/projects/nTcRsgxcDWgr/Architecture/architecture-from-playground-to-dreamKIT-2.png)

This architecture has 2 parts:

-   **(1) Playground general architecture**
-   **(2) Architecture and flow from Playground to dreamKIT**

This page is focused on **(1) Playground general architecture**. For more information about **(2) Architecture and flow from Playground to dreamKIT**, please refer [Playground to dreamKIT](https://docs.digital.auto/dreamkit/working/deployment/).

## Playground general architecture

![general-architecture](https://bewebstudio.digitalauto.tech/data/projects/nTcRsgxcDWgr/Architecture/general-architecture-2.png)

The playground is a cloud-based web application that is responsible for rapidly prototyping environment for new, SDV-enabled features.

To bring SDV-vehicle development experience to website, we are currently using these technologies and tools on playground:

**Front-end:**

-   React: Front-end library
-   TailwindCSS: CSS framework

**Back-end:**

-   Netlify: Utilize for server-side functions such as authentication and permissions
-   Firebase Firestore: Database

**Other:**

-   Brython: Allow to run Python code in browser environment
-   Socket.IO: Real-time bidirectional communication
-   Web Assembly: Execute high performance, low level code in browser
-   COVESA VSS: Syntax and catalog for vehicle signal
-   Velocitas: Toolchain to create containerized in-vehicle application

## Dive deeper into playground

Please have a glance at below picture. This picture describes components and how things work in the Playground dashboard.

![playground-dashboard](https://bewebstudio.digitalauto.tech/data/projects/nTcRsgxcDWgr/Architecture/playground-dashboard-2.png)

Before coming to what a Playground dashboard is, let's take a look at some of the components in the image above:

-   **VSS-API**: APIs that adhere to the format of COVESA Vihicle Signal Specification. You can also create your custom APIs.
-   **Simulator**: Provide simulation for VSS-APIs. This is written in Python and later translated to Javascript code to execute within browser environment. More information please refer [How Python-Javascript works](https://docs.digital.auto/advanced/how-python-javascript-works/)
-   **code.py**: Python script responsible for interacting with the VSS-API and handle associated logics.
-   **Widget**: UI apps that fetch data from VSS-API and display them. There are 2 types of Widgets:
    -   The built-in widgets
    -   Custom widgets: These are managed and published at [marketplace](marketplace.digitalauto.tech)
-   **AI Engine**: 3rd-party services such as LandingAI

**So what is Playground dashboard?**

|                                                 Dashboard Diagram                                                  |                                              Dashboard Config on Playground                                              |                                             Actual Dashboard on Playground                                             |
| :----------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------: |
| ![dashboard-diagram](https://bewebstudio.digitalauto.tech/data/projects/nTcRsgxcDWgr/Architecture/dashboard-2.png) | ![dashboard-config](https://bewebstudio.digitalauto.tech/data/projects/nTcRsgxcDWgr/Architecture/dashboard-config-2.png) | ![dashboard-actual](https://bewebstudio.digitalauto.tech/data/projects/nTcRsgxcDWgr/Architecture/dashboard-actual.png) |

Playground dashboard is where you can place your Widgets. Dashboard has 10 tiles. A widget can be placed on one or many tiles. You also have options to config the widget, such as which APIs this widget are interacting with.

## The server migration

![server-migration](https://bewebstudio.digitalauto.tech/data/projects/nTcRsgxcDWgr/Architecture/server-migration.png)

In aforementioned architecture, 3rd-party services (Firebase and Netlify) enhance the speed of development. However, as the application scales, this part of system transitions from a facilitator to a burden, making optimization more challenging and introducing additional complexities to the development process. That is why we are in progress to migrate these serverless platform to our self-managed server (using NodeJS and MongoDB)
