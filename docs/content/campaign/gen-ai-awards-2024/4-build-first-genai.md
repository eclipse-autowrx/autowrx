---
title: "Build your GenAI"
date: 2023-08-03T06:48:57+07:00
draft: false
weight: 4
---

This guide shows how you can build a simple GenAI Python by using prompt engineering methods.

**1.** After accessing the AWS Bedrock console, navigate directly to the Playground/chat section to begin experimenting.
![1](https://bewebstudio.digitalauto.tech/data/projects/vW9gFVaiF33Z/GenAI%20Awards%20-%20How%20to%20build%20your%20GenAI/1-chat.jpg)

**2.** Select the model you want to experiment with.
![2](https://bewebstudio.digitalauto.tech/data/projects/vW9gFVaiF33Z/GenAI%20Awards%20-%20How%20to%20build%20your%20GenAI/3-chat.jpg)

**3.** First, choose the provider, then select the model from this provider, and press "apply" to return to the playground chat interface.
![3](https://bewebstudio.digitalauto.tech/data/projects/vW9gFVaiF33Z/GenAI%20Awards%20-%20How%20to%20build%20your%20GenAI/4-select.jpg)

**4.** Try the simple prompt: "Generate an SDV Python code to open the driver's door."
![4](https://bewebstudio.digitalauto.tech/data/projects/vW9gFVaiF33Z/GenAI%20Awards%20-%20How%20to%20build%20your%20GenAI/5-input.jpg)

**5.** The returned result is general and not specific to the playground. The LLMs generate too many comments, whereas we only require code.
![5](https://bewebstudio.digitalauto.tech/data/projects/vW9gFVaiF33Z/GenAI%20Awards%20-%20How%20to%20build%20your%20GenAI/6-test.jpg)

**6.** You can enhance model responses by employing specific instructions known as "system messages". These messages provide context for the model during API calls and are hidden from the end user, helping the model understand the context and follow your directives more accurately. Below are examples of system messages that you can use as guidelines for constructing your own instructions:

GenAI Python: (https://bewebstudio.digitalauto.tech/data/projects/alSxlS1Qkf20/GenAI_Python.md)

GenAI Dashboard: (https://bewebstudio.digitalauto.tech/data/projects/alSxlS1Qkf20/GenAI_Dashboard.md)

GenAI Widget: (https://bewebstudio.digitalauto.tech/data/projects/alSxlS1Qkf20/GenAI_Widget.md)

Do not copy these system messages directly into the interface. Instead, use them as templates to create specific instructions under "Instruction:" and place your requests under "Requirement:" to tailor the model's output to your needs. After identifying the most effective instruction or system message, save it and submit it to [marketplace.digitalauto.tech](https://marketplace.digitalauto.tech) for public use.

![2](https://bewebstudio.digitalauto.tech/data/projects/vW9gFVaiF33Z/GenAI%20Awards%20-%20How%20to%20build%20your%20GenAI/7-context.jpg)

**7.** The returned result after adding the instruction will include only code specific for the playground without any additional comments.
![5](https://bewebstudio.digitalauto.tech/data/projects/vW9gFVaiF33Z/GenAI%20Awards%20-%20How%20to%20build%20your%20GenAI/8-result.jpg)

**8.** Paste the code into the code tab, then run the prototype and observe the API value changes. Optionally, consider adding widgets to better visualize the API's value. If you are not yet familiar with the Playground, it is advisable to build your first prototype by following this ["Hello world" prototype's guide](https://docs.digital.auto/engaged/helloworld/)

![5](https://bewebstudio.digitalauto.tech/data/projects/vW9gFVaiF33Z/GenAI%20Awards%20-%20How%20to%20build%20your%20GenAI/9-code.jpg)
![5](https://bewebstudio.digitalauto.tech/data/projects/vW9gFVaiF33Z/GenAI%20Awards%20-%20How%20to%20build%20your%20GenAI/10-dashboard.jpg)
