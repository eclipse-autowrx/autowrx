---
title: "Vehicle API"
date: 2023-08-03T06:32:41+07:00
draft: false
weight: 6
---

# Vehicle API introduction
Vehicle API is an abstract way to manipulate everything an actuator on vehicle, or get a sensor value from vehicle without knowledge of ECU and E/E Architechture.
On the context of Software define Vehicle, we are an application developer. We would like to make an smart application to serve special purpose. Let's say we would have an AI algorithm to turn on or off the headlight depend on weather condition and some other factors, and then the algorithm output say that we should turn the light on. How can we do that if we don't know anything about embedded, CAN signal, ECU, gateway, and plenty of security, safety stuff... you can not do that. Vehicle API was born to solve that problem.

There are plenty of Vehicle API depend of OEM, Vehcile Model,... and definitely each one have different syntax, params and structure. digital.auto dealing with problem by allow you below approach:
- Allow you select an exist API set
- Allow you extend an exist API set
- Allow you to define your own API set

**One again, digital.auto is a playground to dev and test your vehicle application. It is very important to using the APIs compatible with the exist APIs on the vehicle. So that, after successfully testing your vehicle, you can deploy your app directly to your vehicle and run on it.** 

To make thing simple and general, our examples will go with COVESA VSS API, an open source standard that growing and promissing to be industrial standard in the near future.

# COVESA VSS API
The Vehicle Signal Specification (VSS) is an initiative by [COVESA](https://covesa.github.io/vehicle_signal_specification/#:~:text=an%20initiative%20by-,COVESA,-to%20define%20a) to define a syntax and a catalog for vehicle signals. The source code and releases can be found in the [VSS github repository](https://covesa.github.io/vehicle_signal_specification/#:~:text=VSS%20github%20repository). Some tools for parsing and converting VSS files can be found in the [VSS-tools github repository](https://covesa.github.io/vehicle_signal_specification/#:~:text=VSS%2Dtools%20github%20repository).

COVESA VSS nesting API together in a tree
![](https://covesa.github.io/vehicle_signal_specification/images/instances.png?width=60pc)


When you create new Vehicle Model, make sure you choose the correct API standard.
![](https://bewebstudio.digitalauto.tech/data/projects/6D9qAxt57P4e/doc_vss/new_model_api.png)

Now it's time to explorer API tree. Select a Vechicle Model, than click on **Vehicle APIs**.
![](https://bewebstudio.digitalauto.tech/data/projects/6D9qAxt57P4e/doc_vss/model_click_api.png)

In the **Vehicle APIs** view, your using search box to looking for the API
![](https://bewebstudio.digitalauto.tech/data/projects/6D9qAxt57P4e/doc_vss/prototype_api_view.png)

On the left side, we have list of API.
Each API will belong to one os these type: 
- **Branch**: a tree node contain other APIs or branchs
- **Actuator**: API to control a actuator
- **Sensor**: API to get value from a sensor
- **Attribute**: acceptable value for **Actuator** or **Sensor**

Using the search box to search for API name, you can specify the only types you want to search.

On top right corner, click on "Tree View" to render the API list in Tree style.

![](https://bewebstudio.digitalauto.tech/data/projects/6D9qAxt57P4e/doc_vss/api_tree_view.png)

# Wishlist API
In case you need to use an API, but it does not exist. You can add a "wish API".The wishlist API is marked with a purpel cicle W icon. You can also filter default API or WishList API from the search box.

![](https://bewebstudio.digitalauto.tech/data/projects/6D9qAxt57P4e/doc_vss/api_wishlist.png)

## Add new Wistlist API

![](https://bewebstudio.digitalauto.tech/data/projects/6D9qAxt57P4e/doc_vss/create_wistlist_api.png)
Pay attention on the API name, the syntax must follow the rule bellow.

**[branch_name].[branch_name].[...].name**

If your top most branch name is **Vehicle**, you always have to start your api with **Vehicle.**

# Using API
Up to now you have plenty of API, defaults API set define by standard and Wishlist API define by you. Remember that all of them associate with one Vehicle Model. All Protoype under a Vehicle Model share that API set.

In prototype, when writing python code on the left pannel, you can search and click API on the right panel.


![image](https://bewebstudio.digitalauto.tech/data/projects/6D9qAxt57P4e/docs/api_search.png)

 For **Actuator**, we have Set/Get/Subcrible functions, but for **Sensor**, we only can Get/Subcrible
 
 ![](https://bewebstudio.digitalauto.tech/data/projects/6D9qAxt57P4e/docs/copy_api_set.png)
