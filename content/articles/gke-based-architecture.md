---
title: Deploying an app on a GKE cluster
description: Learn how to deploy a real application with front and backend on a Google Kubernetes Engine
img: /gke-cloud.png
alt: Google Kubernetes Engine
readingTime: 5 minutes
author:
  name: Thibault Ruaro
  bio: Thibault is a GCP Professional Architect, with a passion for great code. He likes reading about code best practices and staying up-to-date concerning the latest IT subject. He is also an official Spring Core Trainer, where he gives training at Zenika on a monthly basis.
  image: /thibault-ruaro.png
---
# Cloud CMR App V2

## Overview
This project is to help the CMR to develop and enhance their IT by having a new application. It is composed of 2 modules: 
* cloudcmr-back: the backend, based on Spring boot (2.3.3-RELEASE at this time). Rest API.
* cloudcmr-front: the frontend, based on VueJS (2 at this time). Using Vuex, Router, EsLint, Mocha + Chai and Cypress

## How to run locally
For now, you need to have an Internet connection, it does not work fully locally.

Here are the external dependencies:
- GCP - Firebase for token authentication and verification
- GCP - Cloud Datastore for data storage (emulator possible to work locaaly)

### Install Cloud SDK (if necessary)
Before everything, you need Cloud SDK installed. This connects to your GCP project and helps you a lot:
```shell script
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```
Sources:
- [Install cloud SDK](https://cloud.google.com/sdk/docs/downloads-interactive)

### Connect your host to the correct GCP project
These steps are optional (I guess) if you just installed the cloud SDK. 
```shell script
# To connect to the GCP Platform
gcloud auth application-default login
## Warning : You might want using a Service account (more secure, principle of least privilege...)
gcloud auth activate-service-account SERVICE_ACCOUNT@NAME --key-file=PATH_TO_JSON_KEY_FILE --project=PROJECT_NAME

# Set the project you want to use. This project will host the Datastore for the data storage
gcp config set core/project PROJECT_NAME
```
Sources:
- [Configure the Cloud SDK](https://cloud.google.com/sdk/gcloud/reference/config/set)
- [Service account login](https://cloud.google.com/sdk/gcloud/reference/auth/activate-service-account)

### Running the datastore emulator
By default, without the emulator, the project connects to the real GCP project online. This could be a problem for test speed,
no internet access. To solve this, Google created an emulator you can install and run to automatically connect your local application
to an "in-memory" datastore.
```shell script
# Install the emulator
gcloud components install cloud-datastore-emulator

# Start the emulator
gcloud beta emulators datastore start
```
By default, the data will be persisted in a file on your filesystem. To avoid this, for instance when running test suites, you can work fully in-memory
```shell script
gcloud beta emulators datastore start --no-store-on-disk
```
As soon as the emulator shuts down, the data is lost.

Sources
-  [Installing the Datastore emulator](https://cloud.google.com/datastore/docs/tools/datastore-emulator)

### Building and Running the Cloudcmd-back module
The module is based on gradle wrapper. If you want to build the project with gradle, or run it, you can do the following commands:
```shell script
cd cloudcmr-back
# Build all the module and run the tests
./gradlew build
# Start the spring boot application
./gradlew bootRun
```
To check if your application is up and running, access this: http://localhost:8080/api/actuator/health
> Without any token, you cannot access the application backend, except the actuator health endpoint. 

## Building and Running the Cloudcmr-front module
`yarn` is used to build the front module. The module has been created using the `vue-cli`.

```shell script
cd cloudcmr-front
yarn serve
```
Your webserver will be reloaded everytime you change your js files, and so improves your development speed.
As configured in `vue.config.js`, the webserver is accessible at `http://localhost:8088`.

To build your module for production, use:
```shell script
cd cloudcmr-front
yarn build
```

## Delve deeper
This part to explain a bit more about the production target, what are my concerns that drive my decision...

### Production target
I intend to use GCP as the cloud provider to host this application.

The main concern is the money, as this application is for association, I don't want a system that runs and cost a lot. I want
it to be as cheap as possible.

### Hosting the back: Cloud Run

The back runs in `Cloud Run`. There is a Dockerfile in `cloudcmr-back/src/main/dockerDockerfile` that builds and package the back in Docker image.

A note on the `dockerfile`
1. Is a multi-build stage
2. It builds the jar using `./gradlew` and an `adoptOpenJdk JDK 11` image.
3. Run the jar using an `adoptOpenJdk JRE 11` image
> AdoptOpen JDK were the one I knew the most, and the smallest. As explained later, I wanted to have very small image to reduce GCP storage cost

A note on `Cloud Run`
- Your instance can be scaled down to zero when there is no traffic -> Match perfectly with my cost constraint
- Can be configured easily using the CLI or a deployment file (which I use) to set parameters for auto-scaling like concurrency limit, the number of instance you allow to scale a most...
- You need to leave the port assigned via an environment variable provided by Cloud Run
```yaml
#appliction.properties
server:
  port: ${PORT:8080}
```
- The Cloud Run deployment file is `cloudcmr-back-service.yaml`, where it describes:
    - the region
    - the max number of auto-scaled instance
    - the image I want to deploy
        - By the way, as I am not on master, I use a environment variable, replace by the `envsubst` tool during the step
    - the container port
    - the resources limit (CPU/Memory)
    - the traffic split (always 100% to the new version)

Sources:
- [Cloud Runs configuration documentation](https://cloud.google.com/run/docs/configuring/memory-limits)

#### Why not App Engine ? 
At first, I used App engine Standard environment for the same reason I am using `Cloud Run`. But, there is some limitation I wanted to avoid:
- You do not have the possibility to choose freely your Runtime environment
    - I intend to test native image, which can be done with `Cloud Run`, not `App Engine`
- Is one of the first service provided by Google, and `Cloud Run` seems newer and more attractive
- When I was doing the CI/CD (explain later) I didn't find that it that easy to use. The build was taking a lot of time, and I had to configure almost everything by hand

### Storing the data: Firestore in Datastore mode

The most cost-effective for my usage is to use Firestore in Datastore mode. You have to pay for data transfer and storage only.
I know I won't have a lot of traffic and high volume transfer, so it seems to fit my need perfectly.

[As advice by Google](https://cloud.google.com/datastore/docs/firestore-or-datastore#choosing_a_database_mode), I used the Firestore in Datastore mode because I am in a server mode,
not interacting directly with end clients, using mobiles for instance.

I considered using Cloud SQL, as it is easier to test locally (in-memory database like `H2` or `HSQLDB`)
but it is too expensive:
- You pay for compute engines you are using, which never scales down to 0
- In production environment, you want a replica for a hot backup recovery plan, which cost even more
- Relational databases are not silver bullet, and I think my business fits nicely in a NoSQL Database (like datastore)

### Hosting the front: Firebase hosting service

Still considering cost as my major constraint, I use Firebase hosting solution to reduce the cost of hosting my static `js` files.
Your website is available quickly to all your end users, and it is very cheap, as you pay for the size of your static files.

Because of this solution, having the front and the back hosting separately, I configured my server to allow request only from the Firebase host.

#### Handling the authentication : Firebase authentication service

I use Firebase Authentication service, which uses the Cloud identity in your GCP console. The authentication needs to be done
between the front and the authentication service. The backend, can only check if the token is valid, it can't create a valid firebase token.

> I do not know exactly why the firebase admin sdk for java does not allow token creation based on user/password...

### Continuous Deployment : Cloud build

To be as efficient as possible, but also to see `Cloud build` in action, I configured the continuous deployment pipeline using 
`cloud build`.

The pipeline is pretty straightforward:
1. Building the back docker image and deploying it on Cloud Run. Each time, I have a new revision created
2. Building the front and hosting it on firebase ([check this link to know how to](https://cloud.google.com/cloud-build/docs/deploying-builds/deploy-firebase))

For a first use, Cloud build is okay, but there is a lot of improvements:
- You can manipulate only `steps` which lake of abstraction and reusability
- No easy way of caching dependencies (example with yarn)
- The `waitFor` is not very intuitive, and you need some thinking to use it properly

To use it properly:
- I created `cloudbuild.yaml` files, which contains the steps to build the application
- I used `Source repositories` to link my github with my GCP projects
- I created `Cloud build triggers` to trigger the build when I push on a branch
    - I have only one trigger for any branch but master for now. But it will come soon 

Even if this is simple, I've tried to optimize it as much as I could, in order to see how far I could go with `Cloud Build`

#### How to improve build speed
[Official link](https://cloud.google.com/cloud-build/docs/speeding-up-builds) to get Google adive to improve build. 
I used almost all of them.

##### Using Kaniko cache (deprecated, due to error with appCDS, kaniko cache has been disable)

My Dockerfile is using the `gradle wrapper`, which download the gradle libs every time I build my docker image.

I had two solutions to avoid this:
1. Using the official gradle docker image, but the image is 3 to 4 times bigger than the AdoptOpenJDK
2. Using the AdoptOpenJDK smaller image, but downloading the gradle wrapper each time

I chose the 2nd solution and in order to improve the build speed, I used `Kaniko` caching system.

With the Kaniko cache, if my `build.gradle` didn't change, the dependencies and the `gradle wrapper` are not downloaded again.

Be careful of the Storage cost that comes with it. Indeed, The cached docker image are stored in 
a Cloud Storage bucket. This is one of the reason why I try to use very small Docker image, to reduce Cloud Storage cost. 

Sources:
- [Kaniko Cache google documentation](https://cloud.google.com/cloud-build/docs/kaniko-cache)

##### Caching directory using Cloud storage
I was very disappointed when I realized that `Cloud Build` has no automatic way to provide a cache system. The solution recommended is to use
`Cloud storage` in order to deal with a cache.

I needed a cache when building the front using `yarn`. As you might know, when building your `yarn` project, you need
first to run `yarn install` which download and install all dependencies it needs to then run `yarn build`.

To save a lot of times and bandwidth, The solution I use is to download and upload the local dependencies needed by yarn. 
The yarn dependencies folder is compressed to reduce the size on Cloud Storage. 

I added 2 technical steps to deal with the cache:
1. Download and uncompressed the compressed dependencies from a Google Storage bucket.
2. Execute the yarn action
3. Upload the compressed folder into Cloud Storage Bucket

Besides, the fact there is no "easy" way to cache, there is also no easy way to ignore a failed step in Cloud build.
For instance, if you execute the pipeline for the first time, you will not find file in the bucket, and you can't uncompress them.
So you just want to ignore the error, as it is normal... To do that manually in shell, use this

```shell script
a commant that might fail || exit 0
```

Sources:
- [Caching using Storage Bucket](https://cloud.google.com/cloud-build/docs/speeding-up-builds#caching_directories_with_google_cloud_storage)

#### Avoid the upload of unnecessary files
Cloud Build sends the entire project into the Cloud if you don't say otherwise. To avoid this situation, mostly when 
you are trying to test locally your cloud build configuration file `gcloud builds submit .`, you can use `.gcloudignore` file.

Ignore your local dependencies folder mostly like:
- node_modules
- .git
- jar files
- Globally, everything that is useless for the build

You will save some storage fee by doing so.

Sources: 
- [Cloud build ignore file](https://cloud.google.com/cloud-build/docs/speeding-up-builds#gcloudignore)

## Improving start time on cloud run
### Resources

As always, the Google documentation provides great tips for start time improvements for Cloud Run: [Link to doc](https://cloud.google.com/run/docs/tips/java)

### What is my current start-time and why do improving it ?

Improving start time is useful for :
- Having a first response send to the client quickly
- Avoiding request timeout and impacting negatively the customer experience
- Improving customer experience
- Having a proper scalable system with quick failover

Currently, with Spring Boot 2.3.3 and an OpenJDK11 on Docker, the start time is arougn 25seconds, which is causing timeout on first request.

Following the Cloud Run documentation, here are the steps done to decrease boot time

### Playing with the JVM

A first step is to disable some optimization when the JVM is running, with the `-XX:+TieredCompilation -XX:TieredStopAtLevel=1`.
This can decrease performance on long run, but your mileage may vary.

Then, you can also skip the JVM classes verification. This step is to make sure the classes you are executing haven't been modified
by an attacker (man in the middle attack when transferring Jar files for instance). But, as I am running my Jar on Docker, 
I hope my Docker image will "protect" this from happening. Therefore, I am confident I can safely use the `-noverify` options.

Those 2 modifications have impacted the `cloudcmr-back-service.yaml`. The recommendation is to add an Environment variable when running the container:
```yaml
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
        #... some configuration
      - env:
        - name: JAVA_TOOL_OPTIONS
          value: "-noverify -XX:+TieredCompilation -XX:TieredStopAtLevel=1"
```
WARNING : This is not working with Cloud Run, I've added thos properties in the Dockerfile instead

 
### Using the AppCDS
We start seeing some articles about the AppCDS. Basically, the JVM will have to build a model in its memory representing the application classes and all
its dependencies. This takes time during the startup, and is made everytime you run your application. In order to help the JVM, you can provide a
cds file. By reading this file, the JVM will already have information about your application, and the boot time will be shorter, as there is less discovery to do.

A MAJOR limitation with Spring-Boot is the famous FAT jar created by your build tool. The FAT jar embedded its JAR dependencies as JAR file. Unfortunatly, the AppCDS
tools provided by the JVM are not able to analyse them, and so the resulting cds file will not help much the JVM, a most of the discovery still need to be done.

In order to achieve this, the recommended way is to create your own custom FAT jar, with everything inside flatten. The Google documentation provides the 
way to do so with Maven. As I am using Gradle, here is my configuration:
```groovy
// add a new import to transform files from the different jars
import com.github.jengelman.gradle.plugins.shadow.transformers.PropertiesFileTransformer

// add a new plugin
plugins {
    // ...
    id 'com.github.johnrengelman.shadow' version '6.0.0'
}

// add the manifest configuration (for the Main-class at least)
jar {
    manifest {
        attributes(
                'Main-Class': 'com.cloud.cmr.CloudCmrApplication'
        )
    }
}

// configure the shadowJar task
shadowJar {
    // exclusion of files META-INF/*.DSA|SF|RSA is automatic

    // exclude this, otherwise the jdeps tool does not work
    exclude 'module-info.class'
    // Required for Spring
    mergeServiceFiles()
    append("META-INF/spring.handlers")
    append("META-INF/spring.schemas")
    append("META-INF/spring.tooling")
    transform(PropertiesFileTransformer) {
        paths = ["META-INF/spring.factories"]
        mergeStrategy = "append"
    }
}
```

Then, you can run the `./gradlew shadowJar` task. This generates `build/libs/cloudcmr-back-1.0.0-SNAPSHOT-all.jar`. You can run it:
```
java -jar build/libs/cloudcmr-back-1.0.0-SNAPSHOT-all.jar
```

Resources used:
 - [Gradle shadow plugin](https://imperceptiblethoughts.com/shadow/getting-started/#default-java-groovy-tasks)
 - [Article to configure shadow jar for Spring boot](https://suspendfun.com/2020/Shadow-gradle-plugin-to-create-fat-jar/)

If at this step you have no error, carry on.

Now, we will configure the AppCDS.

```
# First, create a file that lists the classes accessed by your application:
java -XX:DumpLoadedClassList=build/libs/classes.lst -jar build/libs/cloudcmr-back-1.0.0-SNAPSHOT-all.jar --appcds=true

# Second, generate the JSA archive file
java -Xshare:dump -XX:SharedClassListFile=build/libs/classes.lst -XX:SharedArchiveFile=build/libs/appcds.jsa --class-path build/libs/cloudcmr-back-1.0.0-SNAPSHOT-all.jar

# Finally, Try to run it with the AppCDS archive file provided it and see if the start times decreases
java -Xshare:on -XX:SharedArchiveFile=build/libs/appcds.jsa -jar build/libs/cloudcmr-back-1.0.0-SNAPSHOT-all.jar
```

Let's add this to your Dockerfile to change the CD pipeline. Weirdly, the recommendation provided by Google was not working for me.
If I add the `appCDS` file generation in the builder part of my build, I got the error, which I don't really understand, so I couldn't fix it.
```
A jar file is not the one used while building the shared archive file: /app.jar
```

The error seems to be related to Kaniko cache... I can't yet reproduce this bug... Will need to delve deeper later

#### And the result 

The application now starts **in 4 to 5 seconds**, instead of 15 seconds or more. **It was worth it !**



Here is the DockerFile that generated the error :

```dockerfile
# Use the gradlew to build image. Should be cached with kaniko
FROM adoptopenjdk/openjdk11:jdk-11.0.8_10-alpine as builder

# Copy local code to the container image.
WORKDIR /app
COPY build.gradle .
COPY gradlew .
COPY gradle ./gradle
RUN ./gradlew dependencies

# Build a release artifact.
COPY src ./src
RUN ./gradlew build shadowJar -x test -x bootJar
RUN cp /app/build/libs/*-all.jar /app.jar

########
## Here are the relevant steps to generate inside the builder the appCDS file
########

## Generate the appCDS
RUN java -XX:DumpLoadedClassList=/classes.lst -jar /app.jar --kill
# From the captured list of classes (based on execution coverage),
# generate the AppCDS archive file.
RUN java -Xshare:dump -XX:SharedClassListFile=/classes.lst -XX:SharedArchiveFile=/appcds.jsa --class-path /app.jar

# Use AdoptOpenJDK for base image.
FROM adoptopenjdk/openjdk11:jdk-11.0.8_10-alpine

# Copy the jar to the production image from the builder stage.
COPY --from=builder /app.jar /app.jar
########
Here I import the appCDS file from the builder
########
COPY --from=builder /appcds.jsa /appcds.jsa
#ENV JAVA_TOOL_OPTIONS="-noverify -XX:+TieredCompilation -XX:TieredStopAtLevel=1"

# Run the web service on container startup.
CMD ["java", "-XX:+TieredCompilation", "-XX:TieredStopAtLevel=1", "-Xshare:on", "-XX:SharedArchiveFile=/appcds.jsa", "-jar", "/app.jar"]
```

How the problem was solved ? I've generated the appCDS in the last docker build step, which fixed the issue.
Here is the correct Dockerfile:

```dockerfile
# Use the gradlew to build image. Should be cached with kaniko
FROM adoptopenjdk/openjdk11:jdk-11.0.8_10-alpine as builder

# Copy local code to the container image.
WORKDIR /app
COPY build.gradle .
COPY gradlew .
COPY gradle ./gradle
RUN ./gradlew dependencies

# Build a release artifact.
COPY src ./src
RUN ./gradlew build shadowJar -x test -x bootJar
RUN cp /app/build/libs/*-all.jar /app.jar

# Use AdoptOpenJDK for base image.
FROM adoptopenjdk/openjdk11:jre-11.0.8_10-alpine

# Copy the jar to the production image from the builder stage.
COPY --from=builder /app.jar /app.jar
########
## Here are the relevant steps to generate inside the builder the appCDS file
########
## Generate the appCDS
RUN java -XX:DumpLoadedClassList=/classes.lst -jar /app.jar --kill
# From the captured list of classes (based on execution coverage),
# generate the AppCDS archive file.
RUN java -Xshare:dump -XX:SharedClassListFile=/classes.lst -XX:SharedArchiveFile=/appcds.jsa --class-path /app.jar

# Run the web service on container startup.
CMD ["java", "-Xshare:on", "-XX:SharedArchiveFile=/appcds.jsa", "-jar", "/app.jar"]
```

#### And the result 

The application now starts **in 4 to 5 seconds**, instead of 15 seconds or more. **It was worth it !**
