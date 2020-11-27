---
title: Deploying your Spring Boot application in Cloud Run
description: In this first part, we focus on deploying a Spring application to Cloud Run easily.
image: /articles/deploying-an-app-in-gcp-part1/main.jpg
alt: The GCP logo
readingTime: 30 minutes
createdAt: 2020-11-17
author:
  name: Thibault Ruaro
  bio: Thibault is a GCP Professional Architect, with a passion for great code. He likes reading about code best practices and staying up-to-date concerning the latest IT subject. He is also an official Spring Core Trainer, where he gives training at Zenika on a monthly basis.
  image: /thibault-ruaro.png
---

# Introduction

Nowadays, it is possible for anyone who wishes it to start an application using the latest Google Cloud Technologies to deploy an entire application. Modern web application requires most of the time splitting the front, what users see, and the back, what handles user requests.

In this series of articles, we will see how to deploy step by step a complete application. We will progressively cover topics like:
* Hosting docker container on Cloud Run. Very useful when you have a low budget and enterprise needs.
* Continuous deployment. Using Cloud builds to trigger a build and deploying your last version in your environment.
* Configuring application security of a Spring based application with Firebase Identity. How to handle user authentication using JWT.
* Hosting a Vue application in Firebase. Enjoy Firebase CDN and deploy your SPA to target an international audience easily.

## Prerequisites

### A Github Account

If you don't have it, I highly recommend you to create one, right now. I'll be using a public repository hosted on my account. My examples will use my repository in the command, but you will need yours when we will communicate with Cloud Repository. [Click here to create an account on Github](https://github.com/join?ref_cta=Sign+up&ref_loc=header+logged+out&ref_page=%2F&source=header-home)

Also, make sure `Git` is installed on your machine, and you can execute commands like `git clone...`

### A Google Cloud Platform Account

The examples will deploy your application in your GCP environment. To do so, you need your own GCP account.

If you create the account, you will get $300 (270€) credit to use their infrastructure during a year. Please note you will have to use a credit card to create the account on Google. [Click here to sign up on GCP](https://cloud.google.com/free)

If you already have an account, please note things we do together will incur very small fees on your account. If you follow all articles rigorously, you might have no more than 1€ on your billing account at the end of the month. 

Make sure you also create a first project that will contain the resources created in the articles.

#### Install the gcloud CLI

Even if you could use the Cloud Shell, I recommend you using the `gcloud` CLI on your machine. Trust me, it is really handy. [To install the CLI, click here](https://cloud.google.com/sdk/docs/install)
Check the CLI is installed on your machine, by running `gcloud version` in your shell.

Then, execute the following command, to make sure you are pointing to the correct project
```
gcloud config set core/project ${PROJECT_ID}
```

### Docker installed locally

Docker is not 100% mandatory, but personally I like testing locally if my development or Dockerfile are correct. It shortens the feedback loop, which gives me more flexibility to adapt when things don't work out.

Therefore, I suggest you to install Docker locally. [Here are the resources to do so](https://docs.docker.com/get-docker/) 

# Building the Spring application

You can now start building the first application. We will create a `Hello world` application, that exposes an endpoint.
The application can evolve later, but let's keep it simple and build it step by step. Just like software development should be done gradually, deploying your application with short iterations shortens the feedback loop. Detect bugs as soon as they appear to reduce the time needed to fix it. 

## Create the application backend

I invite you to create a skeleton using the [Spring Initializer website](https://start.spring.io). Here are the information I use:
* Maven project
* Java
* Spring Boot version: 2.4.0
* Group: dev.truaro.blog
* Artifact: gcpcloudrunback
* Name: GCP Cloud Run Backend
* Description: My awesome back office fully managed by Cloud Run
* Package name: dev.truaro.blog.gcpcloudrunback
* Dependencies: Spring Web

This generates a zip file you can unzip. Having in mind what comes after this article, I recommend you to have the following folder structure:
```
* gcpapplication
|--- gcpcloudrunback <- unzipped folder
|--- gcpfirebasefront <- will come in another article
```

**Please note for the rest of this article, the root folder is `gcpapplication/gcpcloudrunback`**

Let's review the important part together:

In `/pom.xml`, make sure you have a dependency to `spring-boot-starter-web` and the plugin `spring-boot-maven-plugin`. This will activate Spring Boot's autoconfiguration to embed a Tomcat, and enable the Fat JAR generation.
```xml
...
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
...
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```

In `src/main/java/dev/truaro/blog/gcpcloudrunback/GcpCloudRunBackendApplication.java`
```java
@SpringBootApplication
public class GcpCloudRunBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(GcpCloudRunBackendApplication.class, args);
	}
}
```
Classic `@SpringBootApplication` class to start Spring and the Application Context.

## Add your first controller

Let's add a simple controller that says `Hello World` on a GET request at `/`. 

Create a file `src/main/java/dev/truaro/blog/gcpcloudrunback/HelloWorldController.java`
```java
@RestController
public class HelloWorldController {
    
    @GetMapping("/")
    public String helloWorld() {
        return "Hello World";
    }
   
}
```
Briefly, this class sends a 200 HTTP Response containing the body `Hello World` in plain text:
* `@RestController` -> the class is returning only data to the clients. This annotation bypasses the view resolver of `Spring MVC`.
* `@GetMapping` -> Listen a GET request on the endpoint `/`.

## Configure the server port

A recommendation of Cloud Run is to enable your application to listen the port provided by the PORT environment variable ([for more information, check this link](https://cloud.google.com/run/docs/configuring/containers)).

To do so with Spring, just a property to the `application.properties` file:
```
server.port=${PORT:8080}
```
> If you want to set a property based on an environment variable with a default, use this: ${MY_ENV_VARIABLE:my default value}. Here, we get the PORT from the environment, or we fall back to 8080.

## Request the server to see if it works

Make sure your controller can handle requests with a provided PORT by executing:
```shell script
./mvnw install
PORT=8088 java -jar target/gcpcloudrunback-0.0.1-SNAPSHOT.jar
```

Go check the URL `http://localhost:8088`, and you should see `Hello World` displayed.

![Skeleton started - First step success](/articles/deploying-an-app-in-gcp-part1/skeleton-started.png)

## Overview

This step wasn't much, but at least you have the basis to go on when we will deploy this resource into GCP using Cloud Run.

# Deploying the application into Cloud Run

Before talking about Continuous Deployment, let's first deploy our application manually on Cloud Run.

## Quick words on Cloud Run

**Cloud Run "Fully managed"** is a service provided by GCP that allows you to run a container (Docker for instance) on the Google infrastructure. It has many advantages:
* The cost is very attractive. Indeed, you pay only for the CPU allocated, and the CPU is allocated only when your container receives an HTTP request. In other words, you only pay when your container is being used.
* You run a container, which makes you independent of the runtime environment provided by Google in a case of App engine Standard for instance. Besides, it is easy for you to test your container locally.
* As a container, you can easily host your application elsewhere, in another provider for instance.

> See the resources part for full resources URL on Cloud Run.

## Containerize the application

Let's add this Dockerfile at the root of our application. We will use a multistage build, as it is an even more portable solution.
```dockerfile
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

Try building the image locally and then run it to make sure it works as expected
```shell script
docker build -t gcr.io/truaro-resources/gcp-cloudrun-back:latest .
docker run -d -p 8080:8080 gcr.io/truaro-resources/gcp-cloudrun-back:latest
> 6b7fd5ca6136af33589c100d6d45884c304cdaf2299b9f1416a33dc607db08e2
curl http://localhost:8080/
> Hello World
docker stop 6b7fd5ca6136af33589c100d6d45884c304cdaf2299b9f1416a33dc607db08e2
```

Then, we need to push it to our repository. Run this command:
```shell script
# Connect docker to google registry. This put your credentials for Cloud Registry into your Docker configuration to authenticate on GCP
gcloud auth configure-docker
# Enable the repository API for your project
gcloud services enable containerregistry.googleapis.com
# Push the image to the google registry
docker push gcr.io/truaro-resources/gcp-cloudrun-back:latest
```

## Create the Cloud Run service description file

If you are familiar with `kubernetes` you might have seen already the kubernetes description file. The process is similar for Cloud Run. Let's create a `/gcp-cloudrun-back.yaml` description file for our Cloud Run service, and go through it step by step.
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
      serviceAccountName: gcp-cloudrun-back
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
      - image: gcr.io/${PROJECT_ID}/gcp-cloudrun-back:latest
        resources:
          limits:
            cpu: 1000m
            memory: 256Mi
  traffic:
    - percent: 100
      latestRevision: true
```
> Please update the `${PROJECT_ID}` with your own project ID

Let's explain each important part.
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: gcp-cloudrun-back
  labels:
    cloud.googleapis.com/location: europe-west1
```
> * `metadata.name`: the name of the service being deployed in Cloud Run. You can then use this name to get your Cloud Run service.
> * `metadata.labels.cloud.googleapis.com/location`: The region in which you want to deploy your application. I chose europe/west1, but you can choose another one if you want to.

```yaml
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: '3'
```
> * Here we define the maximum number of instances Cloud Run is allowed to generate if your service is handling lots of requests. The limit we set is 3, making sure you won't get a nice surprise at the end of month on your GCP invoice.

```yaml
  spec:
    serviceAccountName: gcp-cloudrun-back
    containerConcurrency: 80
    timeoutSeconds: 300
```
> * `serviceAccountName`: It is a good practice to use specific service account in order to respect more easily the Principle of least privilege. Gives this service account only access to what it is allowed.
> * `containerConcurrency`: The number of request to handle on a single instance before scaling up. 80 is the default value.
> * `timeoutSeconds`: The time within a response must be returned by your service. Failure to do so will result in a 504 error sent to the client.

```yaml
    containers:
      - image: gcr.io/${PROJECT_ID}/gcp-cloudrun-back:latest
```
> * `image`: The image name the container will execute. As you guessed it, the image needs to be accessible by Cloud Run. We will see later how to add the image to Container registry.

```yaml
    resources:
          limits:
            cpu: 1000m
            memory: 256Mi
```
> * `cpu`: We allocate the equivalence of 1 CPU to our service. [Read more here](https://cloud.google.com/run/docs/configuring/cpu).
> * `memory`: We allocate 256Mi to the container. Please consider this carefully, as your container can run out of memory on production. [Read more here](https://cloud.google.com/run/docs/configuring/memory-limits).

```yaml
  traffic:
    - percent: 100
      latestRevision: true
```
> * At each revision, the new one takes 100% of the incoming traffic.

## Deploy to Cloud Run
Now we are all setup, let's deploy our first revision, and make it public.

1. Enable the Cloud Run API.
```shell script
gcloud services enable run.googleapis.com
```

2. Create a **service account** for the Cloud Run service. This ensures the respect of the **Principle of least privilege**.
```
gcloud iam service-accounts create gcp-cloudrun-back \
    --description="Service account that executes the gcp-cloudrun-back application" \
    --display-name="GCP Cloudrun Back service account"
```

3. Deploy on Cloud Run (it might take some minutes).
```shell script
gcloud beta run services replace gcp-cloudrun-back.yaml \
  --platform=managed \
  --region=europe-west1
```
> Applying new configuration to Cloud Run service [gcp-cloudrun-back] in project [truaro-resources] region [europe-west1]
>  New configuration has been applied to service [gcp-cloudrun-back].
>
>  URL: **https://gcp-cloudrun-back-a75acdipmq-ew.a.run.app**

4. Allow public access to invoke your service.
```shell script
gcloud run services add-iam-policy-binding gcp-cloudrun-back \
  --platform=managed \
  --region=europe-west1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```
> Updated IAM policy for service [gcp-cloudrun-back]

5. Check if the service is responding (the first request could be a bit long because of the startup time).
```shell script
curl https://gcp-cloudrun-back-a75acdipmq-ew.a.run.app
```
> Hello World

Check your container logs ([Follow this](https://cloud.google.com/run/docs/logging)). Here are mine:
```
2020-11-16 21:14:01.573 CET . ____ _ __ _ _
2020-11-16 21:14:01.573 CET /\\ / ___'_ __ _ _(_)_ __ __ _ \ \ \ \
2020-11-16 21:14:01.573 CET( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
2020-11-16 21:14:01.573 CET \\/ ___)| |_)| | | | | || (_| | ) ) ) )
2020-11-16 21:14:01.573 CET ' |____| .__|_| |_|_| |_\__, | / / / /
2020-11-16 21:14:01.573 CET =========|_|==============|___/=/_/_/_/
2020-11-16 21:14:01.574 CET :: Spring Boot :: (v2.4.0)
2020-11-16 21:14:01.574 CET
2020-11-16 21:14:01.856 CET2020-11-16 20:14:01.853 INFO 1 --- [ main] d.t.b.g.GcpSkeletonApplication : Starting GcpSkeletonApplication v0.0.1-SNAPSHOT using Java 11.0.8 on localhost with PID 1 (/app.jar started by root in /)
2020-11-16 21:14:01.857 CET2020-11-16 20:14:01.857 INFO 1 --- [ main] d.t.b.g.GcpSkeletonApplication : No active profile set, falling back to default profiles: default
2020-11-16 21:14:05.265 CET2020-11-16 20:14:05.265 INFO 1 --- [ main] o.s.b.w.embedded.tomcat.TomcatWebServer : Tomcat initialized with port(s): 8080 (http)
2020-11-16 21:14:05.284 CET2020-11-16 20:14:05.284 INFO 1 --- [ main] o.apache.catalina.core.StandardService : Starting service [Tomcat]
2020-11-16 21:14:05.284 CET2020-11-16 20:14:05.284 INFO 1 --- [ main] org.apache.catalina.core.StandardEngine : Starting Servlet engine: [Apache Tomcat/9.0.39]
2020-11-16 21:14:05.473 CET2020-11-16 20:14:05.473 INFO 1 --- [ main] o.a.c.c.C.[Tomcat].[localhost].[/] : Initializing Spring embedded WebApplicationContext
2020-11-16 21:14:05.473 CET2020-11-16 20:14:05.473 INFO 1 --- [ main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 3394 ms
2020-11-16 21:14:06.778 CET2020-11-16 20:14:06.777 INFO 1 --- [ main] o.s.s.concurrent.ThreadPoolTaskExecutor : Initializing ExecutorService 'applicationTaskExecutor'
2020-11-16 21:14:07.391 CET2020-11-16 20:14:07.390 INFO 1 --- [ main] d.t.b.g.GcpSkeletonApplication : Started GcpSkeletonApplication in 7.221 seconds (JVM running for 8.938)
2020-11-16 21:14:07.653 CET2020-11-16 20:14:07.652 INFO 1 --- [nio-8080-exec-9] o.a.c.c.C.[Tomcat].[localhost].[/] : Initializing Spring DispatcherServlet 'dispatcherServlet'
2020-11-16 21:14:07.653 CET2020-11-16 20:14:07.652 INFO 1 --- [nio-8080-exec-9] o.s.web.servlet.DispatcherServlet : Initializing Servlet 'dispatcherServlet'
2020-11-16 21:14:07.654 CET2020-11-16 20:14:07.654 INFO 1 --- [nio-8080-exec-9] o.s.web.servlet.DispatcherServlet : Completed initialization in 0 ms
```

As you could see, my application took **7.221 seconds to start**. In some infrastructure, this could be too long... I will leave the startup time optimization for another article.

# Summary

In this article, we covered:
* How to create a Spring Boot application with a single non-protected endpoint
* How to activate Google APIs using `gcloud services enable...` 
* How to dockerize a Spring Boot application with a multi-stage build
* How to push on Container registry
* How to deploy an image on Cloud Run using a description file

## What's next

In further articles, we will cover subjects like:
* Configuring a Continuous deployment pipeline using Cloud Build
* Securing your application using Firebase and Spring security
* Developing a static VueJS App that requests our Cloud Run service
* Deploying this application on Firebase Hosting
* Optimizing the Boot time of your application to improve the scalability

## Resources

* [See the entire code on Github](https://github.com/truar/blog-resources.git)
* [Documentation for Cloud Run](https://cloud.google.com/run/docs/choosing-a-platform)
* [Pricing of Cloud Run](https://cloud.google.com/run/pricing#cloudrun-pricing)
* [Caching Maven dependencies in a multistage build](https://medium.com/@nieldw/caching-maven-dependencies-in-a-docker-build-dca6ca7ad612)
* [Docker build command](https://docs.docker.com/engine/reference/commandline/build/)
* [Docker run command](https://docs.docker.com/engine/reference/commandline/run/)
