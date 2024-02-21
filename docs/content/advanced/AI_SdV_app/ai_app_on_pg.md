---
title: "AI App Concept"
date: 2023-09-25T07:07:47+07:00
draft: false
weight: 1
---

### Preface
This document for AI engineer who familiar with AI application development concept.

It assumes you have basic understanding on Vehicle API concept, we provide simple explanation at this [VSS Basic Documentation](/playground/engaged/vss_basic).

The purpose of this document is to discuss AI-on-Edge, means realtime AI running directly on vehicle, not apply for AI-on-Cloud like ChatGPT...

### AI application on playground
Nowadays, AI is a hot topic. There are plenty of tools, libraries and methods to build and deploy an AI application or reuse AI service from 3rd provider. In the scope of this tutorial, we discuss about the process to build an AI application by your own, test it on **digital.auto playground**, and deploy it to **PoC HW** such as dreamKIT...

There are many ways to deploy an AI app for vehicle, the diagram below is a suggestion on how to use AI with Vehicle APIs.

![](https://bewebstudio.digitalauto.tech/data/projects/6D9qAxt57P4e/docs_ai/ai_on_pg.png)

Ideally, the vehicle application developed on digital.auto playground could be executed on edge without any modification. This is enabled by the abstracted vehicle APIs, and container technology. 

The power of API abstraction gives us the freedom to implement AI a little bit different (or absolutely different) on each environment. On web, digital.auto playground, we are limited by Javascript runtime, so we should go with [TensorFlow.JS](https://www.tensorflow.org/js). TensorFlowJS, by using WASM, can access your GPU to accelerate the calculation.
For an AI vision app, most of the time input will be an image and your trained model. Then you can set the output to Vehicle API. From now on, all the vehicle app can get Vehicle value and implement their logic.

Next, moving your Vehicle App to PoC HW to testing. On this context, you need an AI service to turn image stream to API value. You can use TensorFlow again (to reuse the sample AI model) or other tools such as PyTorch. It depends on your HW environment, license, cost and plenty of other factors.


