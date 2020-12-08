---
title: Creating a Continuous Deployment pipeline to deploy a Vue application in Firebase using Cloub Build
description: To continue with the series consisting in deploying a full application in GCP, we will focus on deploying a Vue application in Firebase using Cloud Build to create the Continuous Deployment pipeline
image: /articles/continuous-deployment-with-cloud-build-in-firebase/main.png
alt: Vue and Firebase Logo
readingTime: 20 minutes
createdAt: 2020-12-09
author:
  name: Thibault Ruaro
  bio: Thibault is a GCP Professional Architect, with a passion for great code. He likes reading about code best practices and staying up-to-date concerning the latest IT subject. He is also an official Spring Core Trainer, where he gives training at Zenika on a monthly basis.
  image: /thibault-ruaro.png
---

# Introduction

We just created a simple Vue application deployed in Firebase in the [previous article](/build-deploy-vue-app-in-firebase-with-cloudrun-backend). Like I mentioned many times in this blog, regular feedback are key to build a successful application. 

Let's enhance the Continuous Deployment pipeline we created in [Continuous Deployment pipeline with Cloud Build on Cloud Run](/continuous-deployment-with-cloud-build) to add automatic deployment of the frontend part of our application. 

To remind you, we previously created a nice Vue application communicating with a Cloud Run backend application. The application was deployed on Firebase to have an international audience with no effort. Le's automate this deployment.

Here is the [Github project](https://github.com/truar/blog-resources) you can clone to follow the article.

# Create the Continuous Deployment pipeline for a Firebase deployed application

I won't cover all the subjects like I did in [Continuous Deployment pipeline with Cloud Build on Cloud Run](/continuous-deployment-with-cloud-build). If you started from here and you wish to configure your GCP project to use Cloud Build, please check previous articles.

## Create a Firebase deployment image

To deploy using Firebase, you need to create an image containing the Firebase CLI, making it easy to deploy your application. Here is the official link to create a [Firebase image to deploy your application](https://cloud.google.com/cloud-build/docs/deploying-builds/deploy-firebase). At the tieme of the article, here are the commands:
```shell script
git clone https://github.com/GoogleCloudPlatform/cloud-builders-community.git
cd cloud-builders-community/firebase
gcloud builds submit .
cd ../..
rm -rf cloud-builders-community/
```
> If those steps does not work for you, check the [official link](https://cloud.google.com/cloud-build/docs/deploying-builds/deploy-firebase) to make sure it didn't change since the article was written (which is very likely)

Those steps create and push a Firebase ready image on your Container Registry which can be used in a Cloud Build pipeline.

To make sure the iamge is in your container, try executing this commmand:
```shell script
gcloud container images list --filter="name:firebase"       

NAME
gcr.io/truaro-resources/firebase
```

## Cloud Build pipeline for Vue application in Firebase

Now you have a Firebase image, let's add new steps to deploy our Vue application. As a reminder, you should have the following project structure:
```
* gcpapplication/
|--- gcpcloudrunback/
|--- gcpfirebasefront/
|--- cloudbuild.yaml
```

The content of `cloudbuild.yaml` after the first pipeline is:
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
> It is deploying only the backend part of our application.

Let's add the Frontend part now.

### Configuring Cloud Build to deploy on Firebase

To deploy on Firebase, your Cloud Build service account must have the role Firebase Admin. Grant the role to your service account with:
```shell script
gcloud projects add-iam-policy-binding truaro-resources \
    --member=serviceAccount:957758254747@cloudbuild.gserviceaccount.com \
    --role=roles/firebase.admin
```
> * Replace `${YOUR_PROJECT_ID}` and `XXXX` by your actual value
> * `roles/firebase.admin`: To allow the Cloud Build service account to deploy on Firebase

Or, [if you follow this](https://cloud.google.com/cloud-build/docs/securing-builds/configure-access-for-cloud-build-service-account), you can also manually enable the Firebase Admin role.

### Adding steps to deploy Vue in Firebase

Just add those 3 steps between the step `deploy-cloud-run` and the `images` part:
```yaml
  - id: 'install-yarn'
    waitFor: ['-']
    name: node
    entrypoint: yarn
    dir: gcpfirebasefront
    args: ['install', '--silent']

  - id: 'build-front'
    waitFor: [ 'install-yarn' ]
    name: node
    entrypoint: yarn
    dir: gcpfirebasefront
    args: [ 'build' ]

  - id: 'deploy-firebase'
    waitFor: [ 'build-front' ]
    name: gcr.io/${PROJECT_ID}/firebase
    args: [ 'deploy', '--project=$PROJECT_ID', '--only', 'hosting' ]
    dir: gcpfirebasefront
```

As always, let's review the important part.

#### Install the yarn dependencies

```yaml
- id: 'install-yarn'
  waitFor: ['-']
  name: node
  entrypoint: yarn
  dir: gcpfirebasefront
  args: ['install', '--silent']
```
> * `waitFor: [ '-' ]`: Run in parallel this step with the others. Indeed, we don't need to wait for the backend to be deployed in order to deploy the front. It is a performance improvements.
> * `name: node`: We use the official `node` image from the Docker hub registry.
> * `entrypoint: yarn`: `yarn` is the package mamanger we use to build the application.
> * `dir: gcpfirebasefront`: We change directory to go in the `gcpfirebasefront`.
> * `args: [ 'install', '--silent' ]`: Just run the `yarn install --silent` command, to package our application for production. Not mandatory, but I find `yarn install` to be quite verbose.

#### Build the Vue application
```yaml
- id: 'build-front'
  waitFor: [ 'install-yarn' ]
  name: node
  entrypoint: yarn
  dir: gcpfirebasefront
  args: [ 'build' ]
```
> * `waitFor: [ 'install-yarn' ]`: `yarn install` needs to be done before moving further
> * `args: [ 'build' ]`: Just run the `yarn build` command, to package our application for production

As you can see, we do not create any Docker image. We simply build the application using `yarn build`. The `dist` folder is located under `/workspace`, the shared volumes of Cloud Build. The next steps will be able to deploy on Firebase what has been built on a previous step.

#### Deploy on Firebase
```yaml
- id: 'deploy-firebase'
  waitFor: [ 'build-front' ]
  name: gcr.io/$PROJECT_ID/firebase
  args: [ 'deploy', '--project=$PROJECT_ID', '--only', 'hosting' ]
  dir: gcpfirebasefront
```
> * `waitFor: [ 'build-front' ]`: Just wait for the previous steps, not the backend steps.
> * `name: gcr.io/$PROJECT_ID/firebase`: Step based on the image we created earlier to use the Firebase CLI
> * `args: [ 'deploy', '--project=$PROJECT_ID', '--only', 'hosting' ]`: The args to be passed to `firebase` command
> * `$PROJECT_ID`: As always, a substitution variable provided by Cloud Build

This step simply executes the command `firebase deploy --project=${PROJECT_ID} --only hosting`

### Review the Cloud Build deployment file

The final file looks like:
```yaml
steps:
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
  
  - id: 'install-yarn'
    waitFor: ['-']
    name: node
    entrypoint: yarn
    dir: gcpfirebasefront
    args: ['install', '--silent']

  - id: 'build-front'
    waitFor: [ 'install-yarn' ]
    name: node
    entrypoint: yarn
    dir: gcpfirebasefront
    args: [ 'build' ]

  - id: 'deploy-firebase'
    waitFor: [ 'build-front' ]
    name: gcr.io/$PROJECT_ID/firebase
    args: [ 'deploy', '--project=$PROJECT_ID', '--only', 'hosting' ]
    dir: gcpfirebasefront

images:
  - 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:$SHORT_SHA'
  - 'gcr.io/$PROJECT_ID/gcp-cloudrun-back:latest'

```

### Change the Vue application to see a change

Just change the `gcpfirebasefront/src/HelloWorld.vue` file. Update the `<h1>` to see the Frontend has been deployed:
```vue
<template>
  <div class="hello">
    <h1>From firebase: {{ msg }}</h1>
```

As we already have the Cloud Build triggers created in the previous articles, simply push your application and everything will be automatically deployed.

To follow up the build execution, go on the console, you will have the logs. Or just use this command to see if the deployment is still ongoing:
```shell script
gcloud builds list --ongoing
46e2992d-24f4-4df5-8190-a6c132a4827b  2020-12-05T12:37:43+00:00            github_truar_try-gcp-deploy@80c5b6d1eb9bc5425e2abec092535ff2a30ee5b6  -       WORKING

```
Once the build terminated (i.e the command output is empty), just access your firebase web application page. Here is the result: ![Result from automatic deployment in Firebase](/articles/continuous-deployment-with-cloud-build-in-firebase/automatic-deployment-firebase-result.png)


# Summary

In this article, we covered:
* Creating a Firebase image to use the `firebase` CLI in a Cloud Build step
* Configuring the Cloud Build service account to deploy applications on Firebase
* Configuring Cloud Build steps to build and deploy a static frontend application

With all the previous articles, we are starting to have nice view on the tools and services we can lever to easily deploy an application on the Cloud. You might have noticed that you haven't lots of fees for this application, even if it is accessible 24/7 anywhere on earth.

## What's next

To go further, we could:
* Configure a cache to improve build speed to avoid downloading frontend dependencies at each build
* Use the multi-site Firebase feature to have a staging and production website
* Split the `cloudbuild.yaml` file to deploy independently the frontend and the backend

## Resources

* [Firebase image to deploy your application with Cloud Build](https://cloud.google.com/cloud-build/docs/deploying-builds/deploy-firebase)
* [Gcloud container CLI](https://cloud.google.com/sdk/gcloud/reference/container/images/list)
* [Project on Github](https://github.com/truar/blog-resources)
