---
title: Improving Cloud Build pipeline with dependencies cache on Cloud Storage
description: In this article we focus on optimizing a Cloud Build pipeline by reducing the build time by adding a dependency cache stored on a Cloud Storage bucket.
image: /articles/improving-cloud-build-with-dependencies-cache/main.png
alt: The Cloud build logo
readingTime: 7 minutes
createdAt: 2021-03-26
author:
  name: Thibault Ruaro
  bio: Thibault is a GCP Professional Architect, with a passion for great code. He likes reading about code best practices and staying up-to-date concerning the latest IT subject. He is also an official Spring Core Trainer, where he gives training at Zenika on a monthly basis.
  image: /thibault-ruaro.png
---


# Introduction

Building a Continuous Deployment pipeline is amazing as you collect feedback on a daily basis. At first, the pipeline is quite quick and deploying applications is easy. But as your application is growing, you might have faced more and more latency... This article is here to show you how you can reduce the build time by adding dependencies cache on Cloud Storage.

For this focus, I'll simply use this `cloudbuild.yaml` file, watch the current deployment time, and explore how we improved it using Google Storage cache.
```yaml
steps:
  - id: 'build-project'
    name: adoptopenjdk/openjdk11:jdk-11.0.8_10-slim
    dir: gcpcloudrunback
    entrypoint: bash
    args:
      - '-c'
      - |
        ./mvnw package
 
  - id: 'dockerize-project'
    name: gcr.io/cloud-builders/docker
    dir: gcpcloudrunback
    args: [ 'build',
            '-t', 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:$SHORT_SHA',
            '-t', 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:latest',
            '.' ]
 
  - id: 'push-to-cloud-registry'
    name: gcr.io/cloud-builders/docker
    args: [ 'push', 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:$SHORT_SHA' ]
 
  - id: 'deploy-cloud-run'
    name: gcr.io/cloud-builders/gcloud
    dir: gcpcloudrunback
    entrypoint: bash
    args:
      - '-c'
      - |
        apt-get update
        apt-get install -qq -y gettext
        export PROJECT_ID=$PROJECT_ID
        export IMAGE_VERSION=$SHORT_SHA
        export SCALING_INSTANCE_COUNT=${_SCALING_INSTANCE_COUNT}
        envsubst < gcp-cloudrun-back.yaml > gcp-cloudrun-back_with_env.yaml
        gcloud beta run services replace gcp-cloudrun-back_with_env.yaml \
          --platform=managed --region=europe-west1
        gcloud run services add-iam-policy-binding gcp-cloudrun-back \
          --platform=managed --region=europe-west1 \
          --member="allUsers" --role="roles/run.invoker"

images:
  - 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:$SHORT_SHA'
  - 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:latest'
```

Here is the associated Dockerfile
```dockerfile
# Use AdoptOpenJDK for base image.
FROM adoptopenjdk/openjdk11:jre-11.0.8_10-alpine

# Copy the jar to the production image from the previous step
COPY target/*.jar /app.jar

# Run the web service on container startup.
CMD ["java", "-jar", "/app.jar"]
```

> * In this pipeline, we build our application using the maven wrapper from our project. Besides, we use a simple Dockerfile, not a multi-staged one.
> * Also note you need to grant Cloud Build service account the `Cloud Run` and `Service Accounts` roles.

# Reducing the build time with cache

Currently, when deploying this pipeline ([based on this Github project](https://github.com/truar/blog-resources/tree/master/gcpapplication)), it takes my build 1 minute and 45 seconds on average to complete. Let's first understand this build time, to see what can be improved. ![Cloud Build deployment time](/articles/improving-cloud-build-with-dependencies-cache/cloud-build-deployment-time-before-cache.png)

> * The longest step is the one where the dependencies need to be installed `build-project`, where we see all the dependencies are downloaded. If you think that those dependencies will not change so often, it clearly needs some optimization to avoid unnecessary resources to be used.

## Add maven cache

Reading Google [Cloud build optimizations documentation](https://cloud.google.com/cloud-build/docs/speeding-up-builds), we can manually add Google Storage cache to reduce build time.
> Note that some Cloud Build competitors offer easily managed caching solutions... such a shame Cloud Build is not and we have to do everything manually.

### Create a storage bucket

We will store our dependencies cache into a specific bucket. Let's create one:
```shell script
gsutil mb gs://${PROJECT_ID}-cache-dependencies
> Creating gs://${PROJECT_ID}-cache-dependencies/...
```
> Replace `${PROJECT_ID}` with your actual project Id. Cloud storage needs a unique name among all the buckets in the system. By prefixing your bucket with your project Id, there is a low chance to collide with another bucket name.

### Add steps to fetch and save the cache

To fetch and save the cache downloaded by Maven:
* We will use the **volumes** features of Cloud Build. By default, Cloud Build persists the folder `/workspace` across your build steps. We can specify other volumes to be persisted.
* Cloud Build does not offer yet an easy way to cache dependencies for any usage across different builds.
* It does not offer also the possibility for a step to fail silently without stopping the pipeline.

Knowing this, here is what the final `cloudbuild.yaml` with dependencies cache looks like:
```yaml
steps:
  - id: 'download-cached-maven-dependencies'
    name: gcr.io/cloud-builders/gsutil
    entrypoint: bash
    volumes:
      - name: 'maven-repository'
        path: '/root/.m2'
    args:
      - '-c'
      - |
        gsutil cp gs://${PROJECT_ID}-cache-dependencies/cache/maven-dependencies.tgz maven-dependencies.tgz || exit 0
        tar -zxf maven-dependencies.tgz --directory / || exit 0
 
  - id: 'build-project'
    name: adoptopenjdk/openjdk11:jdk-11.0.8_10
    dir: mavencachecloudbuild/gcpcloudrunback
    entrypoint: bash
    volumes:
      - name: 'maven-repository'
        path: '/root/.m2'
    args:
      - '-c'
      - |
        ./mvnw package
 
  - id: 'dockerize-project'
    name: gcr.io/cloud-builders/docker
    dir: mavencachecloudbuild/gcpcloudrunback
    args: [ 'build',
            '-t', 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:$SHORT_SHA',
            '-t', 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:latest',
            '.' ]
 
  - id: 'push-to-cloud-registry'
    name: gcr.io/cloud-builders/docker
    args: [ 'push', 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:$SHORT_SHA' ]
 
  - id: 'deploy-cloud-run'
    name: gcr.io/cloud-builders/gcloud
    dir: mavencachecloudbuild/gcpcloudrunback
    entrypoint: bash
    args:
      - '-c'
      - |
        apt-get update
        apt-get install -qq -y gettext
        export PROJECT_ID=$PROJECT_ID
        export IMAGE_VERSION=$SHORT_SHA
        export SCALING_INSTANCE_COUNT=${_SCALING_INSTANCE_COUNT}
        envsubst < gcp-cloudrun-back.yaml > gcp-cloudrun-back_with_env.yaml
        gcloud beta run services replace gcp-cloudrun-back_with_env.yaml \
          --platform=managed --region=europe-west1
        gcloud run services add-iam-policy-binding gcp-cloudrun-back \
          --platform=managed --region=europe-west1 \
          --member="allUsers" --role="roles/run.invoker"
 
  - id: 'upload-cached-maven-dependencies'
    waitFor: [ 'build-project']
    name: gcr.io/cloud-builders/gsutil
    entrypoint: bash
    volumes:
      - name: 'maven-repository'
        path: '/root/.m2'
    args:
      - '-c'
      - |
        tar -zcf maven-dependencies.tgz /root/.m2
        gsutil cp maven-dependencies.tgz gs://${PROJECT_ID}-cache-dependencies/cache/maven-dependencies.tgz

images:
  - 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:$SHORT_SHA'
  - 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:latest'
```

Let's review the important part.

1. The first is about downloading the maven from the Cloud Storage bucket.
```yaml
  - id: 'download-cached-maven-dependencies'
    name: gcr.io/cloud-builders/gsutil
    entrypoint: bash
    volumes:
      - name: 'maven-repository'
        path: '/root/.m2'
    args:
      - '-c'
      - |
        gsutil cp gs://${PROJECT_ID}-cache-dependencies/cache/maven-dependencies.tgz maven-dependencies.tgz || exit 0
        tar -zxf maven-dependencies.tgz --directory / || exit 0
```
> * `name: gcr.io/cloud-builders/gsutil`: use a provided Google image with `gsutil` to manage buckets.
> * `volumes:`: persist a volume across build steps. With maven, the default volume is `/${USER_HOME}/.m2`, which is `/root/.m2` in our different images.
> * `gsutil cp && tar -xzf`: downloading the files from the bucket (in `.tgz` to reduce dependencies size).
> * `|| exit 0`: As mentioned earlier, there is no easy way to ignore steps on error. Just add `exit 0` to make sure if the folder does not exist on the bucket your build does not fail. I know it is not a perfect solution, but the step is small enough not to damage the entire pipeline. Besides, if you don’t have cache, you can still build the application.


2. Use the volume persisted by the previous steps to enhance the `./mvnw` command
```yaml
  - id: 'build-project'
    name: adoptopenjdk/openjdk11:jdk-11.0.8_10-slim
    dir: mavencachecloudbuild/gcpcloudrunback
    entrypoint: bash
    volumes:
      - name: 'maven-repository'
        path: '/root/.m2'
    args:
      - '-c'
      - |
        ./mvnw package
```
> Thanks to the shared volume, when the step will execute `./mvnw package` it will rely on the dependencies provided by Cloud Storage.

3. Upload the dependencies. Very useful if you changed your `pom.xml` and you need to update the cache with the new dependencies
```yaml
  - id: 'upload-cached-maven-dependencies'
    waitFor: [ 'build-project']
    name: gcr.io/cloud-builders/gsutil
    entrypoint: bash
    volumes:
      - name: 'maven-repository'
        path: '/root/.m2'
    args:
      - '-c'
      - |
        tar -zcf maven-dependencies.tgz /root/.m2
        gsutil cp maven-dependencies.tgz gs://${PROJECT_ID}-cache-dependencies/cache/maven-dependencies.tgz
```
> * In this step, we expect it not to fail, so we don't use `exit 0`.
> * We reuse the volume created by `download-cached-maven-dependencies` and potentially modified by `build-project`.
> * We use the `waitFor` to start this step right after the `build-project`, as this volume will no longer be modified later.

### Results

The first build will be slightly longer, as you added 2 steps and there is no cached yet. But the next ones will be faster !

Here is the result of the first build, before the cache was created.![Result of first build](/articles/improving-cloud-build-with-dependencies-cache/first-build-result.png)

Here is the result of the second build, after the cache was created.![Result of sceond build](/articles/improving-cloud-build-with-dependencies-cache/second-build-result.png)

For now, **we save couple of seconds (30 seconds)**, not worth it you might say. But keep in mind your build will get bigger and bigger, and if you do not optimize it, it will take minutes before completion. Today, we simply deploy one single Cloud Run service, but we can deploy 2 or 3, with Cloud Functions as well. If you download maven dependencies each time, you will waste a lot of time and resources. So keep that in mind.


## Bonus: the same for a frontend project with yarn

Here is the `cloudbuild.yaml` file to also save `yarn` dependencies.
```yaml
steps:
  - id: 'download-cached-yarn-dependencies'
    name: gcr.io/cloud-builders/gsutil
    dir: gcpfirebasefront
    entrypoint: bash
    args:
      - '-c'
      - |
        gsutil cp gs://${PROJECT_ID}-cache-dependencies/cache/yarn-dependencies.tgz yarn-dependencies.tgz || exit 0
        tar -zxf yarn-dependencies.tgz || exit 0
 
  - id: 'install-yarn'
    name: node
    entrypoint: yarn
    dir: gcpfirebasefront
    args: ['install', '--silent']
 
  - id: 'build-front'
    name: node
    entrypoint: yarn
    dir: gcpfirebasefront
    args: [ 'build' ]
 
  - id: 'deploy-firebase'
    name: gcr.io/$PROJECT_ID/firebase
    dir: gcpfirebasefront
    args: [ 'deploy', '--project=$PROJECT_ID', '--only', 'hosting' ]
 
  - id: 'upload-cached-yarn-dependencies'
    waitFor: ['build-front']
    name: gcr.io/cloud-builders/gsutil
    entrypoint: bash
    dir: cloudcmr-front
    args:
      - '-c'
      - |
        tar -zcf yarn-dependencies.tgz ./node_modules
        gsutil cp yarn-dependencies.tgz gs://${PROJECT_ID}-cache-dependencies/cache/yarn-dependencies.tgz
```
> Note for yarn the dependencies are located under /workspace folder hierarchies. Therefore, there is no need to add a custom volume to be persisted by Cloud Build

# Summary

In this article focuses on optimizing Cloud Build with Maven and Yarn build steps, we covered:
* Common issues when not caching dependencies, by wasting resources and times
* Creation a bucket using `gsutil` to store dependencies
* Ignore steps in error, which is not provided out-of-the-box by Cloud Build at this time
* Persistence of other folders across a build
* Downloading and fetching files from a Cloud Storage bucket

Please note using Cloud Storage as cache storage will incur small fees as you pay for the GigaBytes stored. But don't worry, the cached maven folder is 61MB, which is free for your usage.

## To go further

If you feel like it, you can improve some parts of the build by:
* Instead of downloading a file from a bucket, why not build an image containing all the dependencies you need ?
* Use a hash to make upload the dependencies only if they changed since last build
* You can also store docker image in a Bucket, which make the build even faster (using Google Jib)
* Improve the build avoiding hiding the errors when downloading the files from the cache folder
* Configure your bucket to delete files older than 2 weeks, in order to save some money for a cache that is no longer used.

## Resources

* [Best practices for speeding up builds](https://cloud.google.com/cloud-build/docs/speeding-up-builds)
* [Cloud Build global configuration file](https://cloud.google.com/cloud-build/docs/build-config)
* [GSutil command to manage buckets](https://cloud.google.com/storage/docs/gsutil)
