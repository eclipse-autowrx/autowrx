---
title: "AI Training Process"
date: 2023-10-11T11:09:47+07:00
draft: true
---
# AI Training Process

### 1. Collect data

In ML/AI, there is an undisputable truth that: No data, no models. In fact, we not only need data, we need to have as much data as possible. So, in order to train a decent model, many sources of data have been scrawled automatically from Youtube, Kaggle, Roboflow, ...

![Data collection](https://bewebstudio.digitalauto.tech/data/projects/eVF2H08DHbMw/pic1.png)

>Suggestion: According to my knowledge, you need at least 500 samples per class to obtain good result, and that's what we recommend you to do when you train your own object detectors.

### 2. Label data with labelImg

Now that you have a pool of images, the next step is to label them. Normally, I use labelImg software as it is completely free and very easy to use.

>Tip: You can contact labelling service providers to get it done for you since this task is quite tedious and time-consuming.

### 3. Training with ultralytics library in Python

After labelling all of the images, you are going to train it on your own chosen model. There are various models on the market that are free to use, such as YOLOv5, YOLOv6, YOLOv7, YOLOv8, Faster R-CNN, EfficientDet, SSD, ...However, in this tutorial, we use YOLOv8 as it is beginner friendly yet very powerful.

![Training Process](https://bewebstudio.digitalauto.tech/data/projects/eVF2H08DHbMw/pic2.png)

>Note: Go to this site to have a better grasp of the details: https://github.com/ultralytics/ultralytics

### 4. Convert the model into Tensorflow.js format

In order to to use the originally trained model in browsers, we have to convert it into tensorflow.js format as browsers only support this format. With ultralytics library, the conversion is just a walk in the park with only one line of code needed. Here's the code to turn it into tensorflow.js format.

```python

from ultralytics import YOLO

model = YOLO("path/to/model.pt")

model.export(format="tfjs")

```
