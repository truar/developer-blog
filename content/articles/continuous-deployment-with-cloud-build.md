---
title: Deploying your application in GCP - Part 2
description: In this second part, we create a continuous deployment pipeline using Cloud Build and Cloud Source Repositories.
image: /articles/deploying-an-app-in-gcp-part2/main.jpg
alt: The GCP logo
readingTime: 30 minutes
createdAt: 2020-11-22
author:
  name: Thibault Ruaro
  bio: Thibault is a GCP Professional Architect, with a passion for great code. He likes reading about code best practices and staying up-to-date concerning the latest IT subject. He is also an official Spring Core Trainer, where he gives training at Zenika on a monthly basis.
  image: /thibault-ruaro.png
---

# Introduction

Building a software is a long and difficult process that takes time and skills. In order to succeed in our tasks, we as software developers need to craft the software steps by steps. There is a lot of good development practices for writing code, in order to get feedback as soon as possible. But if we set the boundaries at the code itself, we will miss a lot. 

A great team understands the importance of giving users access to the software as soon as possible. Even if the software is not yet complete, allowing the users to play with the application gives you way better feedback than any other things you could do. In other words, the new functionalities need to be deployed as soon as they are done, to collect those precious feedback. 

That is why building a **Continuous Deployment pipeline** as soon as possible will put your product on the best track to become a successful software. Once the pipeline set, you don't bother anymore with feature deployments. You give at ease access to the user almost instantaneously, and collect its feedbacks on a daily basis.

In my journey of Cloud Architect, I have decided to try some GCP features to create a CD pipeline. The ones we cover today are:
* **Cloud Source Repositories**: Mirroring a Github repository, it keeps your code sync on the GCP platform.
* **Cloud Build**: Create a Continuous Deployment pipeline and trigger builds when a change occurs in your repository.

This article is based on the first one where [we created a Spring application and deployed it on Cloud Run](/deploying-an-app-in-gcp-part1). You can directly get the code by [cloning the repository](https://github.com/truar/blog-resources.git)

As a reminder, you should have the following folder structure:
```
* gcpapplication
|--- gcpcloudrunback (this one has been created in the first part)
|--- gcpfirebasefront (you migh not have this one yet)
```
> Please note we will use `gcpapplication` as the root folder in this article.

# Creating a Continuous Deployment pipeline using Cloud Build

Cloud Build is a service that executes your builds on Google infrastructure. De facto, you can create a Continuous Deployment pipeline using Google provided image to build and deploy your application on GCP.

Together, we will use Cloud Build to deploy our previously created Spring Application hosted on Cloud Run.

Cloud Build allows you to define steps executed on a Docker container. Among the features, we will be using:
* **GCP provided image** to enhance our build. Indeed, Google provided images are already available on build execution, there is no need to download them from Docker registry, which could slow down your build.
* **Steps** which are the main concept of Cloud Build: defines sequential or parallel steps to execute your build.
* **Substitutions variables** that enrich our build to favor re-usability.

Before using the Cloud Build API, as always, we need to activate it:
```shell script
gcloud services enable cloudbuild.googleapis.com
```

Under the hood, Cloud Build uses Cloud Storage bucket to store logs and other metadata for the build. This might incur very small fees.

## Building and Pushing our Docker image using Cloud Build

The first step is to build and push our Dockerfile on Container Registry with Cloud Build. To do so, we will simply add a new file called `cloudbuild.yaml` at the root of our project.
```yaml
steps:
  - id: 'dockerize-project'
    name: gcr.io/cloud-builders/docker
    dir: gcpcloudrunback
    args: ['build',
           '-t', 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:$SHORT_SHA',
           '-t', 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:latest',
           '.']

  - id: 'push-to-cloud-registry'
    name: gcr.io/cloud-builders/docker
    args: ['push', 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:$SHORT_SHA']

images:
  - 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:$SHORT_SHA'
  - 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:latest'
```

Let's split this file.

The first step is about building our Dockerfile to generate the Docker image.
```yaml
steps:
  - id: 'dockerize-project'
    name: gcr.io/cloud-builders/docker
    dir: gcpcloudrunback
    args: ['build',
           '-t', 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:$SHORT_SHA',
           '-t', 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:latest',
           '.']
```
> * `steps`: Specifies a list of actions that you want Cloud Build to perform on the GCP environment. Here we define a first step to build our multi-stage Dockerfile.
> * `id`: a unique name across the file that can be used as a reference for parallel build.
> * `name`: The docker image name used to execute the command. You can reference image that will be fetched from Docker registry, or from Google Container Registry. Please note the predefined images fetched from Container Registry are cached by Google.
> * `dir`: The current folder you want to execute the command in. In our project, the `cloudbuild.yaml` file is at the root of our project, but the Dockerfile is in `gcpcloudrunback` folder.
> * `args`: The list of arguments passed to the `entrypoint` statement of the Dockerfile referenced in the `name` part.
> * `$PROJECT_ID`: A substitution variable automatically replaced by Cloud Build when running your build.
> * `$SHORT_SHA`: A substitution variable provided by a Cloud Build trigger. By default, the `SHORT_SHA` is not available as the build needs to be triggered. But we will see how to provide substitutions variables when testing our Cloud Build config without trigger.

The second step is about pushing the Docker image to Container registry.
```yaml
  - id: 'push-to-cloud-registry'
    name: gcr.io/cloud-builders/docker
    args: ['push', 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:$SHORT_SHA']
```
> Even if Cloud Build provides a way to push images created during a successful build using the `images` statement, we still need to manually push the image used in the Cloud Run deployment (will come next) to Container Registry.
>
> By default, the steps are executed sequentially. As we have to build the image before pushing it, we can't do any parallel run.

The final statement pushes images to Container Registry.
```yaml
images:
  - 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:$SHORT_SHA'
  - 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:latest'
```
> You can specify all the images built during your build to Container Registry, they will all be pushed.

In order to check if our configuration works as expected, we can use `gcloud builds submit` command. This command uploads your current folder into a Storage Bucket used by Cloud Build to perform the build.

To reduce the size of the uploaded archive, I recommend creating a `.cloudignore` file containing:
```gitignore
.git
dist
node_modules
vendor
*.jar
target
.firebase
.mvn
.idea
*.iml
mvnw*
build
.gradle
```
> This file covers many things, like maven, gradle, firebase... not all of them are mandatory at the moment for your simple application, but it might get bigger, so let's keep those folders excluded. It doesn't hurt anyway.

Now, from the root folder, run the command (it might take a few minutes):
```shell script
gcloud builds submit . --substitutions SHORT_SHA=local

DONE
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ID                                    CREATE_TIME                DURATION  SOURCE                                                                                          IMAGES                                                     STATUS
926b58b7-d97e-406e-b971-378cf190ab3f  2020-11-19T15:30:09+00:00  1M54S     gs://truaro-resources_cloudbuild/source/1605799808.257327-c27971b7200a4f50ba7f84621e119d6a.tgz  gcr.io/truaro-resources/gcp-cloudrun-back:local (+2 more)  SUCCESS
```

To make sure the image is pushed, you can also list the image on Container Registry using the command:
```shell script
gcloud container images list-tags gcr.io/${PROJECT_ID}/gcp-cloudrun-back

DIGEST        TAGS          TIMESTAMP
f594672dce19  latest,local  2020-11-19T16:31:56
```
> Replace `${PROJECT_ID}` with your actual Project Id.

## Deploying the image on Cloud Run using Cloud Build

When using Cloud Build, GCP uses a service account dedicated to Cloud Build. This service account will communicate with your GCP resources, such as Cloud Run in our case. To allow Cloud Build service account managing Cloud Run resources, we need to add the proper roles to Cloud Build service account. 

### Granting access at Cloud Run to the Cloud Build service account

First, figure out what service account your Cloud Build is using by going on the `GCP web interface` > `Cloud Build` > `Settings`. Once you have the service account name, you can use it in the next commamd.
> You should only replace the `XXXX`, the email domain name should remain the same.

Grant the `roles/run.admin` and `roles/iam.serviceAccountUser` roles to `XXXX@cloudbuild.gserviceaccount.com`
```shell script
gcloud projects add-iam-policy-binding ${YOUR_PROJECT_ID} \
    --member=serviceAccount:XXXX@cloudbuild.gserviceaccount.com \
    --role=roles/run.admin

gcloud projects add-iam-policy-binding ${YOUR_PROJECT_ID} \
    --member=serviceAccount:XXXX@cloudbuild.gserviceaccount.com \
    --role=roles/iam.serviceAccountUser
```
> * Replace `${YOUR_PROJECT_ID}` and `XXXX` by your actual value
> * `roles/run.admin`: To allow the Cloud Build service account to perform creation and modification of Cloud Run revisions.
> * `roles/iam.serviceAccountUser`: To allow the Cloud Build service account to use our specific Cloud Run service account created in [the previous article](/deploying-an-app-in-gcp-part1) to ensure the Principle of least privileges.

Or, [if you follow this](https://cloud.google.com/cloud-build/docs/securing-builds/configure-access-for-cloud-build-service-account), you can also manually enable the Cloud Run Admin and Service Account User roles.

### Adding a new step to deploy to Cloud Run

To make the most of Cloud Build, let's update the `gcpcloudrunback/gcp-cloudrun-back.yaml` description file to use some **substitutions variables**:
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
        autoscaling.knative.dev/maxScale: '${SCALING_INSTANCE_COUNT}'
    spec:
      serviceAccountName: gcp-cloudrun-back
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
        - image: gcr.io/${PROJECT_ID}/gcp-cloudrun-back:${IMAGE_VERSION}
          resources:
            limits:
              cpu: 1000m
              memory: 256Mi
  traffic:
    - percent: 100
      latestRevision: true

```
> From the previous article, we just replaces some value with placeholders. Please do not modify them in the file, we will Cloud Build and `envsubst`, a linux tool, to deploy the revision with correct values.

Now we can add a new step to the `cloudbuild.yaml` file that executes the Cloud Run deployment commands. Add this after the step `push-to-cloud-registry`.
```yaml
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
```
> * `envsubst` is a tool replacing `${ENV_VAR}` statements with the actual value from your environment in the target file. Very handy ! 
> * `${_SCALING_INSTANCE_COUNT}` is a substitution variable we will define in a Cloud Build Trigger.
> * As you can see, we reused the `gcloud beta run` commands we executed in [the previous article](/deploying-an-app-in-gcp-part1).<br/>
  Which is why I insist: start slow with manual command and once you are comfortable, improve gradually and introduce new concepts, like automation script.
> * To execute multiple commands in a single step, you can change the `entrypoint` to `bash` and use the `-c` option.

Execute the deployment command again, and don't forget to add the new substitution variable:
```shell script
gcloud builds submit . --substitutions SHORT_SHA=local,_SCALING_INSTANCE_COUNT=3
```

Check if the deployment is successful:
```shell script
gcloud run revisions list \
  --service=gcp-cloudrun-back \
  --platform=managed \
  --region=europe-west1

   REVISION                 ACTIVE  SERVICE            DEPLOYED                 DEPLOYED BY
✔  gcp-cloudrun-back-n8tcg  yes     gcp-cloudrun-back  2020-11-21 15:12:10 UTC  957758254747@cloudbuild.gserviceaccount.com
✔  gcp-cloudrun-back-jrr7l          gcp-cloudrun-back  2020-11-17 18:18:58 UTC  thibault.ruaro@zenika.com
✔  gcp-cloudrun-back-qfv4q          gcp-cloudrun-back  2020-11-16 20:09:37 UTC  thibault.ruaro@zenika.com
```

## Automating the build with a Cloud Build trigger

### Pushing your code into Cloud Source Repositories

Cloud Source Repositories is a Google solution that host a Git server, like Github, to store your code on a remote server. Having your code on Cloud Source Repositories enables some features like :
* Live application profiling
* Deploying with Cloud Build
* Code search
* And even more

I won't comment much in this article, you basically have to follow the Google documentation to get started.
* If you want to mirror your Github repository, [follow this link](https://cloud.google.com/source-repositories/docs/mirroring-a-github-repository)
* If you want to use Cloud Source Repositories as your remote git directory, [follow this link](https://cloud.google.com/source-repositories/docs/creating-an-empty-repository)

In my opinion, I like having my code open source on Github, so I prefer mirroring my repository. But I leave that choice to you.

### Create the Cloud Build trigger

Execute the command to create a trigger on your **synchronized cloud-source-repositories**:
```shell script
gcloud beta builds triggers create cloud-source-repositories \
    --name=gcpapplication-trigger \
    --repo=${REPO_NAME} \
    --branch-pattern=".*" \
    --build-config=cloudbuild.yaml \
    --substitutions _SCALING_INSTANCE_COUNT=3

Created [https://cloudbuild.googleapis.com/v1/projects/...].
NAME     CREATE_TIME                STATUS
trigger  2020-11-20T08:26:07+00:00
```
> * Hint: To find your `${REPO_NAME}`, you can execute the command `gcloud source repos list`.
> * `branch-pattern`: Let's say that every branch will trigger a build. In real life scenario, you could have a trigger for master, and a trigger for the development branches.
> * We add a substitution variable `_SCALING_INSTANCE_COUNT` to dynamically modify the scalability of our Cloud Run service. Every user substitution variable must start with `_`.
> * For our Cloud Build deployment file, Cloud Build Trigger provides predefined substitutions variables, like `PROJECT_ID` or `SHORT_SHA`.

You could also directly connect your trigger to Github, but I didn't try it. [Here is the documentation of you want to try](https://cloud.google.com/cloud-build/docs/automating-builds/create-manage-triggers#gcloud).

### Trigger the build with a code modification

Modify the class `gcpcloudrunback/src/main/java/dev/truaro/blog/gcpcloudrunback/HelloWorldController.java`:
```java
@RestController
public class HelloWorldController {
    @GetMapping("/")
    public String helloWorld() {
        return "Hello World. I am automatically deployed";
    }
}
```

Commit and push your modification:
```shell script
git add .
git commit -am "Triggering a build"
git push
```

If everything is properly configured, after several minutes, you should see a new revision for the Cloud Run service:
```shell script
gcloud run revisions list \
  --service=gcp-cloudrun-back \
  --platform=managed \
  --region=europe-west1

   REVISION                 ACTIVE  SERVICE            DEPLOYED                 DEPLOYED BY
✔  gcp-cloudrun-back-62jvq  yes     gcp-cloudrun-back  2020-11-21 16:14:18 UTC  957758254747@cloudbuild.gserviceaccount.com
✔  gcp-cloudrun-back-n8tcg          gcp-cloudrun-back  2020-11-21 15:12:10 UTC  957758254747@cloudbuild.gserviceaccount.com
✔  gcp-cloudrun-back-jrr7l          gcp-cloudrun-back  2020-11-17 18:18:58 UTC  thibault.ruaro@zenika.com
✔  gcp-cloudrun-back-qfv4q          gcp-cloudrun-back  2020-11-16 20:09:37 UTC  thibault.ruaro@zenika.com
```

Final check, request the service:
```
curl https://gcp-cloudrun-back-a75acdipmq-ew.a.run.app/
```
> Hello World. I am automatically deployed

# Summary

Congratulations, you created an entire Continuous Deployment pipeline:
* Respecting Google best practices in terms of security (Service Account specific to your service) and development (PORT environment for your container)
* Using mostly `gcloud` to increase your productivity and favor re-usability
* Using Source Repositories to host or mirror your Github project
* Using Cloud Build to define the CD pipeline
* Using Cloud Build Triggers to activate the CD pipeline on any branch pushed to your repository

## My opinion about Cloud Build

I have to admit, I had some fun doing this. But it is not always easy to use, as you have to scroll all over the Google documentation to move on properly (configuring the service account and setting the proper roles took me a while). 

* If you looked as the Cloud Build platform you could see it is not yet very user-friendly. This will strike you when dealing with parallel steps, you won't have a nice output to know what steps are sequential and what steps are parallel. Comparing to its current opponents on the market, like CircleCi or TravisCi, Cloud Build has a long way to go. 
* The fact that only `steps` can be declared does not favor re-usability when creating your pipeline and obfuscate your step intent. Indeed, when dealing with multiples stages and parallel execution, I find my `yaml` file less and less clear, as I have to add comments in order to keep a clear view of my steps purposes. I think adding a notion of `pipeline`, in which you easily configure your steps execution order can favor readability.

## To go further with Cloud Build

You might have realized that Cloud Build does not keep your Docker image in a cache. Which means for each build, you end up downloading your maven repositories. To go further, you could:
* Extract the project compilation from the multi-stage Dockerfile and build your projects in a Cloud Build step. This way, you could download and upload cached maven dependencies easily in a Cloud Storage bucket, and reduce your build time. (I won't even mention storage fees, as your might be string no more than 1Gb...).
* Use what is call **Kaniko cache**, where every step of your Dockerfile is cached. This also reduce your build time, but incurs in higher storage fees, as Kaniko stores every Dockerfile steps in a Cloud Storage Bucket.
* [Check this link for a full list of possible optimizations](https://cloud.google.com/cloud-build/docs/speeding-up-builds)

I will try to provide short articles for those optimizations later.

## What's next

* Define application security based on Firebase token
* Developing a Frontend application to communicate with the Cloud Run service

# Resources

* [More on Cloud Source Repositories](https://cloud.google.com/source-repositories)
* [More on Cloud Build](https://cloud.google.com/cloud-build/docs)
* [More on Cloud Build configuration file](https://cloud.google.com/cloud-build/docs/build-config)
* [Granting access to an account](https://cloud.google.com/iam/docs/granting-changing-revoking-access)
* [Configuring access to Cloud Build Service account](https://cloud.google.com/cloud-build/docs/securing-builds/configure-access-for-cloud-build-service-account)
* [More gcloud commands](https://cloud.google.com/sdk/gcloud/reference)
* [To create a trigger using gcloud](https://cloud.google.com/cloud-build/docs/automating-builds/create-manage-triggers#gcloud)
* [Using a Service Account for Cloud Run](https://cloud.google.com/run/docs/configuring/service-accounts)
* [For a complete list of Cloud Build substitutions](https://cloud.google.com/cloud-build/docs/configuring-builds/substitute-variable-values)
