---
title: "AI Document"
date: 2023-08-03T07:07:47+07:00
draft: true
---

### Phone Use Detection Documentation

1. Tensorflow.js  
   TensorFlow.js is the most popular Javascript library that allows developers to run machine learning and AI models in the browser or on Node.js, enabling efficient and interactive web-based AI applications. Hence, we have used this framework to deploy our model.
   In this implementation, we directly use tensorflow.js library from [its official cdn url](https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js)
2. Development
   Essentially, this stage comprises of 3 steps: collect data, select model, and train.
    - Collect data: Primarily, we gathered data from Youtube, Kaggle for training. For test set, we took images of our team members to objectively evaluate our model’s performance.
    - Select model: At the time the model was developed, YOLOv8 was the state of the art, so we used it for this task.
    - Training: We used default configuration to train since the initial training results already met our expected results.

3. Deployment  
   Since the development environment is not the environment where the model was originally built, pre-processing and post-processing steps are needed to run it in Javascript. Below is a detailed flowchart.
   ![flowchart](https://bewebstudio.digitalauto.tech/data/projects/kljSBwDhZUnS/flowchart.png)

4. How to use it
   Clone the source code from this repo and download the weight and place it in the same folder. Run html file with live server option to run.
