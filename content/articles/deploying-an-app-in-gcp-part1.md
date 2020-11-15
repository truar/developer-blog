---
title: Deploying your application in GCP - Part 1
description: The first article of a series to guide you into deploying a modern web application on GCP
image: /articles/deploying-your-app/main.jpg
alt: The GCP logo
readingTime: 20 minutes
author:
  name: Thibault Ruaro
  bio: Thibault is a GCP Professional Architect, with a passion for great code. He likes reading about code best practices and staying up-to-date concerning the latest IT subject. He is also an official Spring Core Trainer, where he gives training at Zenika on a monthly basis.
  image: /thibault-ruaro.png
---

# Introduction

Nowadays, it is possible for anyone who wishes it to start an application using the latest Google Cloud Technologies to deploy an entire application. Modern web application requires most of the time splitting the front, what users see, from the back, what handles connection to different service and the database.

In this series of articles, we will see how to deploy step by step a complete application. We will progressively cover topics like:
* Configuring application security of a Spring based application with Firebase Identity. How to handle user authentication using JWT.
* Continuous deployment. Using Cloud builds to trigger a build and deploying your last version in your environment.
* Hosting docker container on Cloud Run. Very useful when you have a low budget and want to start slow.
* Hosting a Vue application in Firebase. Enjoy Firebase CDN and deploy your SPA to target an international audience easily.

## Prerequisites

### A Github Account

If you don't have it, I highly recommend you create one, right now. I'll be using a public repository hosted on my account. My examples will use my repository in the command, but you will need yours when we will communicate with Cloud Repository. [Click here to create an account on Github](https://github.com/join?ref_cta=Sign+up&ref_loc=header+logged+out&ref_page=%2F&source=header-home)

Also, make sure `Git` is installed on your machine, and you can execute action like `git clone...`

### A Google Cloud Platform Account

The examples will deploy your application in your GCP environment. To do so, you need your own GCP account.

If you create the account, you will get $300 (270€) credit to use their infrastructure during a year. Please note you will have to use a credit card to create the account on Google. [Click here to sign up on GCP](https://cloud.google.com/free)

If you already have an account, please note that the things will we do together will incur very small fees on your account. If you the articles rigorously, you might have more than 1€ on your billing account. 

Make sure you also create a first project that will contains the resources created in the next articles.

#### Install the gcloud CLI

Even if you could use the Cloud Shell, I recommemnd you using the CLI on your machine, as you will develop an application and send it to the cloud, running local command to try things out. Trust me, it is really handy. [To install the CLI, click here](https://cloud.google.com/sdk/docs/install)
To make sure the CLI is installed in your machine, you can run `gcloud version` in your shell.

# Let's start

## Building the Spring application

You can now start building the first application. We will the application very simple, mostly at first, as there are many things that could get in our way. 
The application will evolve later, but first, we will create a basic `Hello world` application, that publicly exposes an endpoint.

### Clone the skeleton of the application

// TODO Add folder tress view
// TODO Split the front and the back by having a root folder for the application
// application / back
//             / front

Clone the skeleton application I have created, and remove git from it first. You will have to push the code in your Github repository.
```
git clone https://github.com/truar/blog-resources.git
cd blog-resources
rm -rf .git
cd gcp-skeleton
git init
git add .
git commit -m "First commit from skeleton"
git remote add origin [YOUR_PROJECT_URL]
git push -u origin master 
```
> Please note you need to create your github repository before pushing into it

### Requesting the server to see if it works

Make sure everything works by executing:
```
./mvnw install
java -jar target/gcp-skeleton-0.0.1-SNAPSHOT.jar
```

Go check the URL `http://localhost:8080`, and you should see `Hello World` displayed.
![Skeleton started - First step success](/articles/deploying-an-app-in-gcp-part1/skeleton-started.png)

Note: In a first time, this endpoint will also be used as a healthcheck for Cloud run.

### Overview

This step wasn't much, but at least you have the basis to go on when we will deploy this resource into GCP using Cloud run.

## Deploying the application into Cloud Run

Before talking about CD, let's first try to deploy our application manually on cloud run.

### Quick words on Cloud Run

Cloud Run "Fully managed" is a service provided by GCP that allows you to run a container (Docker for instance) on the Google infrastructure. Is has many advantages:
* the cost is very attractive. Indeed, you pay only for the CPU allocated, and the CPU is allocated only when your container receives an HTTP request. In other words, you only pay when your container is being used.
* You run a container, which makes you independent of the runtime environment provided by Google in a case of App engine Standard for instance. Besides, it is easy for you to test your container locally.
* As a container, you can easily host your application elsewhere, in another provider for instance.

> See the resources part for full resources URL on Cloud run.

### Containerize the application

Let's add this Dockerfile at the root of our application. We will used a multistage build, as it is an even more portable solution.
```Dockerfile
FROM maven:3.6.3-openjdk-11-slim as builder

WORKDIR /app
COPY pom.xml .
# Use this optimization to cache the local dependencies. Works as long as the POM doesn't change
RUN mvn dependency:go-offline

COPY src/ /app/src/
RUN mvn package

# Use AdoptOpenJDK for base image.
FROM adoptopenjdk/openjdk11:jre-11.0.8_10-alpine

# Copy the jar to the production image from the builder stage.
COPY --from=builder /app/target/*.jar /app.jar

# Run the web service on container startup.
CMD ["java", "-jar", "/app.jar"]
```

// TODO : Add Docker prerequisites
Try building the image locally and then run it to make sure it works as expected
```shell script
docker build -t gcp-deploy-cloud-run:latest .
docker run -d -p 8080:8080 gcp-deploy-cloud-run:latest
> 6b7fd5ca6136af33589c100d6d45884c304cdaf2299b9f1416a33dc607db08e2
curl http://localhost:8080/
> Hello World
docker stop 6b7fd5ca6136af33589c100d6d45884c304cdaf2299b9f1416a33dc607db08e2
```

### Create the cloud run service description file

If you are familiar with `kubernetes` you might have seen already the kubernetes description file for your deployment. The process is similar for cloud run. Let's create a `yaml` descriptor file for our cloud run service.
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: gcp-cloudrun-back
  labels:
    cloud.googleapis.com/location: europe-west1
  annotations:
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: '3'
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
      - image: gcr.io/${PROJECT_ID}/gcp-cloudrun-back:latest
        ports:
          - containerPort: 8080
        resources:
          limits:
            cpu: 1000m
            memory: 256Mi
  traffic:
    - percent: 100
      latestRevision: true
```
> Please update the ${PROJECT_ID} with your own project ID

Let's explain each important part.
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: gcp-cloudrun-back
  labels:
    cloud.googleapis.com/location: europe-west1
```
* metadata.name: the name of the service being deployed in cloud-run. You can then use this name to get your cloud-run service.
* metadata.labels.cloud.googleapis.com/location: The region in which you want to deploy your application. I chose europe/west1, but you can choose another one if you want to.

```yaml
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: '3'
```
* Here we define the maximum number of instance cloud-run is allowed to generate if your service is handling lots of requests. The limit we set is 3, making sure you won't get a nice suprise at the end of month on your GCP invoice

```yaml
  spec:
    containerConcurrency: 80
    timeoutSeconds: 300
```
* containerConcurrency: The number of request to handle on a single instance before scaling up. 80 is the default value
* timeoutSeconds: The time within a response must be returned by your service. Failure to do so will result in a 504 error sent to the client

```yaml
    containers:
      - image: gcr.io/${PROJECT_ID}/gcp-cloudrun-back:latest
        ports:
          - containerPort: 8080
```
* image: the image name the container will execute. As you guessed it, the image needs to be accessible by cloud-run. We will see later how to add the image to Container registry
* ports.containerPort: the port exposed by your application. The recommendation of Google is to use the environment variable `PORT`. We will do that later.
 
```yaml
    resources:
          limits:
            cpu: 1000m
            memory: 256Mi
```

```yaml
  traffic:
    - percent: 100
      latestRevision: true

```



// Maybe for a second article ?
### Manually deploying the application using gcloud build

**Gcloud build** is a serverless continuous deployment platform, like CircleCi or TravisCi. By providing a `cloudbuild.yaml`, Gcloud build can execute a series of steps in order to deploy your application on the GCP resources, like Cloud run in our case. Among all features, you can find:
* Parallel steps execution, if you deploy independent parts
* View builder logs in real time, to see if your deployment is correctly moving forward
* Provide a series of image maintained by Google to easily deploy application on GCP resources without too much overhead

Let's create a `cloudbuild.yaml` file at the root of our project:
```yaml

```

## Resources

* [Documentation for Cloud Run](https://cloud.google.com/run/docs/choosing-a-platform)
* [Pricing of Cloud Run](https://cloud.google.com/run/pricing#cloudrun-pricing)
* [Caching Maven dependencies in a multistage build](https://medium.com/@nieldw/caching-maven-dependencies-in-a-docker-build-dca6ca7ad612)
* [Docker build command](https://docs.docker.com/engine/reference/commandline/build/)
* [Docker run command](https://docs.docker.com/engine/reference/commandline/run/)
