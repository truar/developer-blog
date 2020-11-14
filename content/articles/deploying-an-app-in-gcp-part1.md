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

```
docker build -t gcp-deploy-cloud-run:latest .
```

## Resources

* [Documentation for Cloud Run](https://cloud.google.com/run/docs/choosing-a-platform)
* [Pricing of Cloud Run](https://cloud.google.com/run/pricing#cloudrun-pricing)
* [Caching Maven dependencies in a multistage build](https://medium.com/@nieldw/caching-maven-dependencies-in-a-docker-build-dca6ca7ad612)
