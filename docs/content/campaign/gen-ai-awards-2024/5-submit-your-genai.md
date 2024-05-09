---
title: "Submit your genAI"
date: 2023-08-03T06:48:57+07:00
draft: false
weight: 5
---

This guide explains how to submit your work for the GenAI Awards. You can make your submission through the [Marketplace](https://marketplace.digital.auto), which accepts a variety of entries, including GenAI, Widget, and Vehicle App projects.

On the [Marketplace](https://marketplace.digital.auto) website, we refer to a GenAI submission as a "Package."

1. From previous **Review your team** screen. Click **Go to marketplace**, or you can go to https://marketplace.digital.auto
   ![open-marketplace](https://bewebstudio.digitalauto.tech/data/projects/nTcRsgxcDWgr/GenAI-Awards/open-marketplace.png)

2. In the marketplace, if you've previously logged into the GenAI website, your login should carry over. If you find yourself not signed in, please log in again using the same account with which you registered your team on the GenAI website.

3. Click Add package to create a new package.
   ![add-package](https://bewebstudio.digitalauto.tech/data/projects/nTcRsgxcDWgr/GenAI-Awards/add-package.png)

4. Fill the information

    4.1 Basic information. This includes Package Name, Short Description, Detail Description. The Visibility should be **public**
    ![basic](https://bewebstudio.digitalauto.tech/data/projects/nTcRsgxcDWgr/GenAI-Awards/basic.png)

    4.2 Choose a category. In the category field, select GenAI. Next, select the type of GenAI that corresponds to your work. A small alert will pop up to remind you that you are part of a team, and this submission will be entered into the GenAI Awards Competition.
    ![choose-category](https://bewebstudio.digitalauto.tech/data/projects/nTcRsgxcDWgr/GenAI-Awards/choose-category.png)

    4.3 Fill credentials and config from **Review your team** screen in previous step. For the message, please refer to [How to build your GenAI](https://docs.digital.auto/advanced/gen_ai_awards/build-first-genai/) step.

    For endpointURL:

    - The syntax of endpoint URL is: `https://bedrock-runtime.us-east-1.amazonaws.com/model/<model_id>/invoke-with-response-stream`
    - Refer to this AWS document to find your model_id: https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html#model-ids-arns
    - For example, if you use Claude 3 Sonnet model, your endpointURL is: https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-3-sonnet-20240229-v1:0/invoke-with-response-stream
      ![fill-credentials-and-config](https://bewebstudio.digitalauto.tech/data/projects/nTcRsgxcDWgr/GenAI-Awards/fill-credentials-and-config.png)
      4.4 Add images. Package Icon, Package Cover, and Feature Images are all required. For Feature Images, you need at least one image.

5. Click **Submit** to submit your GenAI.
6. To view all your submissions, click **My Package** tab in the header of the website.
   ![my-package](https://bewebstudio.digitalauto.tech/data/projects/nTcRsgxcDWgr/GenAI-Awards/my-package.png)

Voila, you have submitted your GenAI. Next step, test it out at our playground website: https://digitalauto.netlify.app

| Note: To submit another genAI, just start over from step 1 again |
| ---------------------------------------------------------------- |
